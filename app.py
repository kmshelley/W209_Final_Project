from flask import Flask
from flask.ext.restful import Api, Resource, reqparse
from flask.ext.runner import Runner
from os import environ
import requests


app = Flask(__name__)
runner = Runner(app)
api = Api(app)


# Enable CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


def all_results(endpoint, params, pagelimit=None):
    params['api_key'] = environ['OPENFEC_API_KEY']
    url = 'https://api.open.fec.gov/v1'+endpoint
    r = requests.get(url, params=params)
    initial_data = r.json()
    if pagelimit:
        num_pages = min(pagelimit, initial_data['pagination']['pages'])
    else:
        num_pages = initial_data['pagination']['pages']
    current_page = initial_data['pagination']['page']

    for record in initial_data['results']:
        yield record

    while current_page < num_pages:
        current_page += 1
        params['page']=current_page
        data = requests.get(url, params=params).json()
        for record in data['results']:
            yield record


class ScheduleABySize(Resource):
    @staticmethod
    def get(committee_id):
        parser = reqparse.RequestParser()
        parser.add_argument('cycle')
        params = parser.parse_args()
        params['sort'] = 'size'
        return [r for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_size/', params)]


class ScheduleAByState(Resource):
    @staticmethod
    def get(committee_id):
        parser = reqparse.RequestParser()
        parser.add_argument('cycle')
        params = parser.parse_args()
        params['page'] = 1
        params['sort'] = '-total'
        return [r for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_state/', params)]


class ScheduleAByZip(Resource):
    @staticmethod
    def get(committee_id):
        parser = reqparse.RequestParser()
        parser.add_argument('cycle')
        params = parser.parse_args()
        params['page'] = 1
        params['sort'] = '-total'
        data = []
        for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_zip/', params):
                data.append(r)
        return data


class ScheduleAByEmployer(Resource):
    @staticmethod
    def get(committee_id):
        parser = reqparse.RequestParser()
        parser.add_argument('cycle')
        params = parser.parse_args()
        params['sort'] = '-total'
        params['per_page'] = 30
        data = []
        pagelimit = 1
        i = 0
        for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_employer/',
                             params, pagelimit=pagelimit):
            if r[u'employer'] not in [u'RETIRED', u'SELF-EMPLOYED', u'NOT EMPLOYED', None, u'INFORMATION REQUESTED',
                                      u'HOMEMAKER', u'SELF', u'SELF EMPLOYED', u'STUDENT', u'REFUSED',
                                      u'NONE', u'DISABLED', u'ENTREPRENEUR', u'N/A',
                                      u'INFORMATION REQUESTED PER BEST EFFORTS', u'ATTORNEY',
                                      u'INFORMATION REQUESTED (BEST EFFORTS)', u'UNEMPLOYED', u'NA', u'PRESIDENT',
                                      u'REQUESTED', u'NONE/RETIRED', u'RETIRED/RETIRED', u'POET',
                                      u'N/A/RETIRED', u'N/A/HOMEMAKER', u'N', u'SELF-EMPLOYED/FARMER',
                                      u'SELF-EMPLOYED/PHYSICIAN', u'SELF/RETIRED',u'NONE/HOMEMAKER',
                                      u'HOMEMAKER/HOMEMAKER',u'SELF-EMPLOYED/INVESTOR',u'SELF/DOCTOR']:
                i += 1
                data.append(r)
            if i == 10:
                break
        return data

class ScheduleAByContributor(Resource):
    @staticmethod
    def get(committee_id):
        parser = reqparse.RequestParser()
        parser.add_argument('cycle')
        params = parser.parse_args()
        params['sort'] = '-total'
        return [r for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_contributor/', params)]

# API ROUTING
api.add_resource(ScheduleABySize, '/committee/<string:committee_id>/schedules/schedule_a/by_size/')
api.add_resource(ScheduleAByState, '/committee/<string:committee_id>/schedules/schedule_a/by_state/')
api.add_resource(ScheduleAByZip, '/committee/<string:committee_id>/schedules/schedule_a/by_zip/')
api.add_resource(ScheduleAByEmployer, '/committee/<string:committee_id>/schedules/schedule_a/by_employer/')
api.add_resource(ScheduleAByContributor, '/committee/<string:committee_id>/schedules/schedule_a/by_contributor/')

if __name__ == "__main__":
    runner.run()
