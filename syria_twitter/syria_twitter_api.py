import StringIO
import abc
import json
import os
import bson
import bson.json_util
import pymongo
from flask import Blueprint
from flask import send_file
from flask.ext.restful import Api, Resource, reqparse

import word_cloud

syria_api = Blueprint('syria_api', __name__)
api = Api(syria_api)


class NodeResource(Resource):

    kvp = reqparse.RequestParser()
    kvp.add_argument('min_followers', type=int, location='args')
    kvp.add_argument('hashtags', type=str, action='append', location='args')
    kvp.add_argument('isis_group', type=str, action='append', location='args')
    kvp.add_argument('group', type=str, action='append', location='args')

    json = reqparse.RequestParser()
    json.add_argument('min_followers', type=int, location='json')
    json.add_argument('hashtags', type=list, location='json')
    json.add_argument('isis_group', type=list, location='json')
    json.add_argument('group', type=list, location='json')

    @staticmethod
    def node_query(args):

        and_clause = []

        tags = args.get('hashtags', None)
        if tags is not None and len(tags) > 0:
            and_clause.append({'tags': {'$in': tags}})

        follower_count = args.get('min_followers', None)
        if follower_count is not None:
            and_clause.append({'followers_count': {'$gte': follower_count}})

        sentiment = args.get('isis_group', None)
        if sentiment is not None and len(sentiment) > 0:
            and_clause.append({'sentiment': {'$in': sentiment}})

        group = args.get('group', None)
        if group is not None and len(group) > 0:
            and_clause.append({'group': {'$in': group}})

        clause_count = len(and_clause)
        if clause_count > 1:
            return {'$and': and_clause}
        else:
            return and_clause[0] if clause_count == 1 else {}

    def args_scrub(self, args):
        args = args.copy()
        self.value_scrub(args, 'hashtags')
        self.value_scrub(args, 'isis_group')
        self.value_scrub(args, 'group', lambda g: int(g))
        return args

    @staticmethod
    def value_scrub(args, key, conv=None):
        value = args.get(key, None)
        if value is not None:
            if isinstance(value, list):
                value = map(lambda v: v.split(","), value)
                value = [item for sublist in value for item in sublist]
            else:
                value = value.split(",")
            if conv is not None:
                value = map(conv, value)
            args[key] = list(set(value))

    def get(self):
        args = self.kvp.parse_args()
        args = self.args_scrub(args)
        node_query = self.node_query(args)
        return self.handle_request(node_query)

    def put(self):
        args = self.json.parse_args()
        node_query = self.node_query(args)
        return self.handle_request(node_query)

    def post(self):
        args = self.json.parse_args()
        node_query = self.node_query(args)
        return self.handle_request(node_query)

    @abc.abstractmethod
    def handle_request(self, node_query):
        pass


class Graph(NodeResource):

    def handle_request(self, node_query):

        if not node_query:
            # protect against empty query (expensive!)
            nodes = {}
            edges = {}
        else:

            nodes = db['nodes'].find(node_query, {'_id': 0})

            nodes = [self.node_scrub(n, i) for i, n in enumerate(nodes)]

            nodes_id = list(set([node['id'] for node in nodes]))

            edges = db['edges'].find(
                {'$and': [
                    {'source': {'$in': nodes_id}},
                    {'target': {'$in': nodes_id}}]},
                {'_id': 0})
            edges = [self.edge_scrub(e, i) for i, e in enumerate(edges)]

        return {'nodes': nodes, 'edges': edges}

    @staticmethod
    def node_scrub(node, index):
        node['id'] = str(node['id'])
        node['size'] = 0.01
        node['label'] = node['id']
        return node

    @staticmethod
    def edge_scrub(edge, index):
        edge['id'] = index
        return edge


class WordCloud(NodeResource):

    def handle_request(self, node_query):

        collection = db['nodes']
        counts = word_cloud.count_hashtags(collection, node_query)

        image = word_cloud.cloud_image(counts)
        image_io = StringIO.StringIO()
        image.save(image_io, "png")
        image_io.seek(0)
        return send_file(image_io,
                         # attachment_filename="cloud.png",
                         # as_attachment=True,
                         mimetype='image/png')


class Hashtags(NodeResource):

    def handle_request(self, node_query):

        collection = db['nodes']

        counts = word_cloud.count_hashtags(collection, node_query)

        return {'hashtags': [count[0] for count in counts]}


class UserDetails(Resource):

    @staticmethod
    def get(id):
        result = db['views'].find({'_id': id})
        return json.loads(bson.json_util.dumps(result))


# API ROUTING
api.add_resource(Graph, '/graph')
api.add_resource(UserDetails, '/user-details/<int:id>')
api.add_resource(WordCloud, '/word-cloud')
api.add_resource(Hashtags, '/hashtags')

# MongoDB
host = "data.enalytica.com"
port = 27017

client = pymongo.MongoClient(host, port)
db = client.stage
db.authenticate("admin", os.environ['ENALYTICA_MONGO_PWD'])