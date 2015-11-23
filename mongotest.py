import pymongo
import os

host = "data.enalytica.com"
port = 27017
db = "w209"

client = pymongo.MongoClient(host, port)
client[db].authenticate("admin", os.environ['ENALYTICA_MONGO_PWD'])
print client[db].collection_names()