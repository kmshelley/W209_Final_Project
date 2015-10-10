import os
import requests
import json
import datetime as dt

sources = ['new_filing','independent-expenditures','districts','candidates','committee','outside-spenders']
data_format = 'json'
records = 2000
total_records = 10000
api = 'XXXXX'

try:
    os.makedirs(os.path.join(os.getcwd(),'data'))
except Exception as e:
    pass

for source in sources:
    print "Fetching data from %s..." % source
    start = dt.datetime.now()
    request_str = 'http://realtime.influenceexplorer.com/api//%s/?format=%s&page=1&page_size=%s&apikey=%s' % (source,data_format,records,api) #api call
    req = requests.get(request_str)
    with open(os.path.join(os.getcwd(),'data','%s_%s.%s' % (source,records,data_format)),'w') as out:
        out.write(req.text) #write response text to new file
    print "Done creating data file. Runtime: %s" % (dt.datetime.now() - start)

print "Done gathering data!"

