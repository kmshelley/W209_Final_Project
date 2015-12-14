from flask import Flask
from flask.ext.restful import Api, Resource, reqparse
from os import environ
import requests
import pymongo
from dateutil.relativedelta import relativedelta
import datetime, os


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
    def get(committee_id, cycle, topk):
        params = {
            'cycle': cycle,
            'sort': '-total',
            'per_page': 100
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
            if i == topk:
                break
        return data


class OutsideForAgainst(Resource):
    @staticmethod
    def get(candidate_id, cycle, for_against, real_nom=False, topk=10):
        convert_for_against = {'for': '24E', 'against': '24A'}
        invert_for_against = {v: k for k, v in convert_for_against.items()}
        ttype= convert_for_against[for_against]
        
        start = datetime.datetime(int(cycle)-1, 1, 1)
        end = datetime.datetime(int(cycle)+1, 1, 1)

        query_results = db.pac_donors.group(
            ['CMTE_ID', 'TRANSACTION_AMT_total'],
            {'CAND_ID': candidate_id,
             'month_year': {'$gte': start, '$lt': end},
             'TRANSACTION_TP': ttype},
            {'list': []},
            'function(obj, prev) {prev.list.push(obj)}'
        )

        query_results = sorted(query_results, key=lambda k: k['TRANSACTION_AMT_total'] , reverse=True)[:topk]
        response = []

        for qr in query_results:

            res = {"total_spend": qr.get('TRANSACTION_AMT_total'),
                   "committee_name": qr['list'][0].get('Committee Name'),
                   "for_against": invert_for_against[qr['list'][0].get('TRANSACTION_TP')],
                   "pac_committee_id": qr.get('CMTE_ID'),
                   "monthly": []}

            set_all_months = set([datetime.datetime.strftime(start+relativedelta(months=m), '%Y-%m-%d')
                                  for m in range(24)])
            months_added = []

            for month in qr['list']:
                strdate = datetime.datetime.strftime(month.get('month_year'),'%Y-%m-%d')
                res['monthly'].append({'date': strdate, 'value': month.get('TRANSACTION_AMT')})
                months_added.append(strdate)

            months_left = set_all_months.difference(months_added)

            for month in months_left:
                res['monthly'].append({'date': month, 'value': 0})

            res['monthly'] = sorted(res['monthly'], key=lambda k: k['date'])

            response.append(res)
        
        return response


class OutsideTopContributors(Resource):
    @staticmethod
    def get(cmte_id, cycle, real_nom=False, topk=10):
        
        cached = list(db.cached_pac_contributors.find({'cmte_id': cmte_id, 
                                                  'cycle': cycle}))
        
        if len(cached)>0:
            return cached[0]['data'][:topk]
        
        else:
        
            start = datetime.datetime(int(cycle)-1, 1, 1)
            end = datetime.datetime(int(cycle)+1, 1, 1)

            query_results = db.pac_contributors.group(
                ['NAME', 'ZIP_CODE', 'TRANSACTION_AMT_total'],
                {'CMTE_ID': cmte_id, 'TRANSACTION_AMT_total': {'$gte': 0},'month_year': {'$gte': start, '$lt': end}},
                {'list': []},
                'function(obj, prev) {prev.list.push(obj)}'
            )

            query_results = sorted(query_results, key=lambda k: k['TRANSACTION_AMT_total'] , reverse=True)[:topk]

            response = []
            for qr in query_results:

                res = {    
                            "contributor_zip": qr.get('ZIP_CODE'),
                            "city": qr['list'][0].get('CITY'),
                            "state": qr['list'][0].get('STATE'),
                            "fips_county": qr['list'][0].get('COUNTY'),
                            "county_name": qr['list'][0].get('county'),
                            "total_spend": qr.get('TRANSACTION_AMT_total'),
                            "contributor_name": qr.get('NAME'),
                            "employer": qr['list'][0].get('EMPLOYER'),
                            "occupation": qr['list'][0].get('OCCUPATION'),
                            "committee_name": qr['list'][0].get('Committee Name'),
                            "pac_committee_id": qr['list'][0].get('CMTE_ID'),
                            "monthly": []}

                set_all_months = set([datetime.datetime.strftime(start+relativedelta(months=m), '%Y-%m-%d') for m in range(24)])
                months_added = []

                for month in qr['list']:
                    strdate = datetime.datetime.strftime(month.get('month_year'),'%Y-%m-%d')
                    res['monthly'].append({'date': strdate, 'value': month.get('TRANSACTION_AMT')})
                    months_added.append(strdate)

                months_left = set_all_months.difference(months_added)

                for month in months_left:
                    res['monthly'].append({'date': month, 'value': 0})

                res['monthly'] = sorted(res['monthly'], key=lambda k: k['date'])
                response.append(res)

            return response

class ContributorsByGeography(Resource):
    @staticmethod
    def get(cycle, cmte_id, aggregation_level='fips'):
        
        cached = db.cached_pac_geography.find_one({'cmte_id': cmte_id, 
                                             'cycle': cycle, 
                                             'aggregation_level':aggregation_level})
        
        if cached:
            return cached['data']
        
        else:
            geo_level = ['COUNTY', 'county','state']
            if aggregation_level == 'zip_code':
                geo_level = ['ZIP_CODE', 'county','state']
            elif aggregation_level == 'state':
                geo_level = ['state']

            start = datetime.datetime(int(cycle)-1, 1, 1)
            end = datetime.datetime(int(cycle)+1, 1, 1)

            condition = {'month_year': {'$gte': start, '$lt': end}}

            if cmte_id:
                condition['CMTE_ID'] = cmte_id


            query_results = db.pac_contributors.group(                                       
                                   geo_level,
                                   condition,
                                   { "total" : 0 },
                                   'function(curr, result) {result.total += curr.TRANSACTION_AMT}')


            response = []
            for qr in query_results:

                res = {    
                            "level": geo_level[0],
                            "cmte_id": condition.get('CMTE_ID'),
                            "location_id": str(int(qr.get(geo_level[0]))) if geo_level[0] in ['COUNTY', 'ZIP_CODE'] else qr.get(geo_level[0]),
                            "name": qr.get(geo_level[1]) if geo_level[0] in ['COUNTY', 'ZIP_CODE'] else qr.get(geo_level[0]),
                            "state": qr.get(geo_level[-1]), 
                            "amount": qr.get('total'),
                        }
                response.append(res)

            return response


class OutsideMonthlyTimeSeries(Resource):
    @staticmethod
    def get(cycle, cmte_id=None, real_nom=False):

        start = datetime.datetime(int(cycle)-1 , 1, 1)
        end = datetime.datetime(int(cycle)+1, 1 , 1, )

        condition = {'month_year': {'$gte': start, '$lt': end}}

        if cmte_id:
            condition['CMTE_ID'] = cmte_id

        query_results = db.pac_contributors.group(
            ['month_year'],
            condition,
            {"total" : 0 },
            'function(curr, result) {result.total += curr.TRANSACTION_AMT}')

        response = {"return_format": [],
                    "description": "this endpoint will return monthly contributions to PACSuu over election cycle"}

        set_all_months = set([datetime.datetime.strftime(start+relativedelta(months=m), '%Y-%m-%d') for m in range(24)])
        months_added = []

        for qr in query_results:

            res = {
                "month_year": qr.get('month_year'),
                "cmte_id": condition.get('CMTE_ID'),
                "amount": qr.get('total'),
            }

            response["return_format"].append(res)
            strdate = datetime.datetime.strftime(qr.get('month_year'),'%Y-%m-%d')
            months_added.append(strdate)

        months_left = set_all_months.difference(months_added)

        for month in months_left:
            response['return_format'].append({"month_year": month,
                                              "cmte_id": condition.get('CMTE_ID'),
                                              "amount": 0})

        return response

class ContributorsByEmployer(Resource):
    @staticmethod
    def get(cycle, cmte_id=None, topk=10, real_nom=False):

        start = datetime.datetime(int(cycle)-1 , 1, 1)
        end = datetime.datetime(int(cycle)+1, 1 , 1, )

        condition = {'month_year': {'$gte': start, '$lt': end} }

        if cmte_id:
            condition['CMTE_ID'] = cmte_id

        query_results = db.pac_contributors.group(
            ['EMPLOYER'],
            condition,
            {"total": 0},
            'function(curr, result) {result.total += curr.TRANSACTION_AMT}'
        )

        query_results = sorted(query_results, reverse=True, key=lambda x: x['total'])[:topk]

        response = {"return_format": [],
                    "description": "this endpoint will return contribution to PACS by employer over election cycle"}

        for qr in query_results:

            res = {
                "employer": qr.get('EMPLOYER'),
                "cmte_id": condition.get('CMTE_ID'),
                "amount": qr.get('total'),
            }

            response["return_format"].append(res)

        return response
        
        
class CommiteeMonthlyFinances(Resource):
    @staticmethod
    def get(cmte_ids, cycle):

        ids = cmte_ids.split(",")

        query_results = db.cmte_finances.find({'cmte_id': {"$in": ids}, 'cycle': str(cycle)})

        response = []
        query_results = list(query_results)

        if len(query_results) > 0:
            all_months = query_results[0]['date']

            for idx, month in enumerate(all_months):
                doc = {'date': month, 'data': None}
                tmp = dict((i,None) for i in ids)
                
                for cid in query_results:
                    cdoc = {'cte_id': cid.get('cmte_id','nan'),
                            'name': cid.get('cmte_name','nan'),
                            'data': {"receipts": cid['receipts'][idx],
                                     "expenditures": cid['expenditures'][idx]}
                            }

                    tmp[cid.get('cmte_id')] = cdoc
                    
                doc['data'] = [tmp[i] for i in ids]
                response.append(doc)

        return response
        
class CandidateMonthlyFinances(Resource):
    @staticmethod
    def get(cand_ids, cycle):

        ids = cand_ids.split(",")

        query_results = db.cand_finances.find({'cand_id': {"$in": ids}, 'cycle': str(cycle)})

        response = []
        query_results = list(query_results)

        if len(query_results) > 0:
            all_months = query_results[0]['date']

            for idx, month in enumerate(all_months):
                doc = {'date': month, 'data': None}
                tmp = dict((i,None) for i in ids)
                
                for cid in query_results:
                    cdoc = {'cand_id': cid.get('cand_id','nan'),
                            'name': cid.get('cand_name','nan'),
                            'data': {"receipts": cid['receipts'][idx],
                                     "expenditures": cid['expenditures'][idx]}
                            }

                    tmp[cid.get('cand_id')] = cdoc
                    
                doc['data'] = [tmp[i] for i in ids]
                response.append(doc)

        return response
# API ROUTING
api.add_resource(ScheduleABySize, '/schedule_a/by_size/<string:committee_id>/<int:cycle>/')
api.add_resource(ScheduleAByState, '/schedule_a/by_state/<string:committee_id>/<int:cycle>/')
api.add_resource(ScheduleAByZip, '/schedule_a/by_zip/<string:committee_id>/<int:cycle>/')
api.add_resource(ScheduleAByEmployer, '/schedule_a/by_employer/<string:committee_id>/<int:cycle>/<int:topk>')



api.add_resource(OutsideForAgainst, '/outside/for-against/<string:candidate_id>/<string:cycle>/<string:for_against>/<int:topk>/<string:real_nom>/')

api.add_resource(OutsideTopContributors,
                 '/outside/top-contributors/<string:cmte_id>/<string:cycle>/<int:topk>/<string:real_nom>/')

api.add_resource(ContributorsByGeography,
                 '/contributors/by_geo/<string:cmte_id>/<string:cycle>/<string:aggregation_level>/')

api.add_resource(OutsideMonthlyTimeSeries,
                 '/outside/timeseries/<string:cmte_id>/<string:cycle>/<string:real_nom>/')

api.add_resource(ContributorsByEmployer,
                 '/contributors/by_employer/<string:cmte_id>/<string:cycle>/<int:topk>/<string:real_nom>/')
                 
api.add_resource(CommiteeMonthlyFinances, '/com_fins/<string:cmte_ids>/<string:cycle>/')
api.add_resource(CandidateMonthlyFinances, '/cand_fins/<string:cand_ids>/<string:cycle>/')
    

# MONGO_DB
host = "data.enalytica.com"
port = 27017

client = pymongo.MongoClient(host, port)
db = client.w209
db.authenticate("admin", os.environ['ENALYTICA_MONGO_PWD'])


if __name__ == "__main__":
    app.run()
