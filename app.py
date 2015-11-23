from flask import Flask
from flask.ext.restful import Api, Resource, reqparse
from os import environ
import requests

app = Flask(__name__)
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
    def get(committee_id, cycle):
        params = {
            'cycle': cycle,
            'sort': 'size',
        }
        return [r for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_size/', params)]


class ScheduleAByState(Resource):
    @staticmethod
    def get(committee_id, cycle):
        params = {
            'cycle': cycle,
            'sort': '-total',
            'per_page': 70
        }
        return [r for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_state/', params)]


class ScheduleAByZip(Resource):
    @staticmethod
    def get(committee_id, cycle):
        params = {
            'cycle': cycle,
            'sort': '-total',
            'per_page': 100
        }
        data = []
        for r in all_results('/committee/'+ committee_id +'/schedules/schedule_a/by_zip/', params):
                data.append(r)
        return data


class ScheduleAByEmployer(Resource):
    @staticmethod
    def get(committee_id, cycle):
        params = {
            'cycle': cycle,
            'sort': '-total',
            'per_page': 50
        }

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


class MonthlyTotals(Resource):
    @staticmethod
    def get(committee_id, cycle, real_nom):
        return {'description': 'this endpoint will return the %s monthly total receipt and disbursement data'
                               'for committee %s in the %d cycle' % (real_nom, committee_id, cycle),
                'return_format': {
                    'monthly_raised': [{'date %Y-%m-%d': 'amount'}, {'date %Y-%m-%d': 'amount'}],
                    'monthly_spent': [{'date %Y-%m-%d': 'amount'}, {'date %Y-%m-%d': 'amount'}],
                    'total_raised': 'float total raised in millions across cycle',
                    'total_spent': 'float total spent in millions across cycle'
                }}


class TopPACs(Resource):
    @staticmethod
    def get(candidate_id, cycle, record_limit, real_nom):
        return {'description': 'this endpoint will return the top %d PACs spending money for or against '
                               'candidate %s in the %d cycle, '
                               'with total and mothly %s spend' % (record_limit, candidate_id, cycle, real_nom),
                'return_format': {
                    'committee_id': 'pac_committee_id',
                    'committee_name': 'pac_name',
                    'for_against': 'for_against',
                    'total_spend': 'total_spend',
                    'monthly': [{'date %Y-%m-%d': 'amount'}, {'date %Y-%m-%d': 'amount'}]
                }}

# API ROUTING
api.add_resource(ScheduleABySize, '/schedule_a/by_size/<string:committee_id>/<int:cycle>/')
api.add_resource(ScheduleAByState, '/schedule_a/by_state/<string:committee_id>/<int:cycle>/')
api.add_resource(ScheduleAByZip, '/schedule_a/by_zip/<string:committee_id>/<int:cycle>/')
api.add_resource(ScheduleAByEmployer, '/schedule_a/by_employer/<string:committee_id>/<int:cycle>/')

api.add_resource(MonthlyTotals, '/monthly_totals/<string:committee_id>/<int:cycle>/<string:real_nom>/')
api.add_resource(TopPACs, '/top_pacs/<string:candidate_id>/<int:cycle>/<int:record_limit>/<string:real_nom>/')






if __name__ == "__main__":
    app.run()
