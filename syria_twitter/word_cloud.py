#! /usr/bin/env python
# -*- coding: utf-8 -*-


# pip install Cython
# pip install git+git://github.com/amueller/word_cloud.git
# pip install Image
# pip install python-bidi

import sys
import unicodedata
import os
import bidi.algorithm
import bson
import bson.son
import pymongo
import wordcloud

import arabic_reshaper

hashtag_count_mapper_source = """
    function () {
        this.tags.forEach(function(tags) {
            tags(pair[0], tags[1]);
        });
    }
"""

hashtag_reducer_source = """
    function (key, values) {
        var total = 0;
        for (var i = 0; i < values.length; i++) {
            total += values[i];
        }
        return total;
    }
"""

hashtag_count_mapper = bson.code.Code(hashtag_count_mapper_source)
hashtag_reducer = bson.code.Code(hashtag_reducer_source)


def count_hashtags_linkanalysis():
    collection = db['link_analysis']
    collection.map_reduce(hashtag_count_mapper, hashtag_reducer, "hashtag_counts")
    counts_mr = mongo['stage']['hashtag_counts']
    counts_mr.create_index([('value', pymongo.DESCENDING)])
    counts = counts_mr\
        .find({}, {'value': 1})\
        .sort('value', -1).limit(256)
    counts = map(lambda count: (count['_id'], int(count['value'])), counts)
    cloud_file(counts, "counts")


def count_hashtags(collection, query={}, limit=256):
    counts = collection.aggregate(
        pipeline=[
            {"$match": query},
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": bson.son.SON([("count", -1), ("_id", -1)])},
            {"$limit": limit}
        ]
    )

    return map(lambda count: (count['_id'], int(count['count'])), list(counts))


def cloud_image(counts, width=800, height=400, background_color='black'):
    if sys.platform == "darwin":
        wc = wordcloud.WordCloud(
            font_path='/Library/Fonts/Arial.ttf',  # NOTE: font_path is OS X specific
            width=width, height=height, background_color=background_color)
    else:
        wc = wordcloud.WordCloud(
            font_path='/usr/share/fonts/truetype/msttcorefonts/Arial.ttf',
            width=width, height=height, background_color=background_color)
    wc.fit_words(map(order_and_shape, filter(bad_unicode, counts)))
    return wc.to_image()


def cloud_file(counts, basename, width=800, height=400, background_color='black'):
    cloud_image(counts, width, height, background_color).save(basename + ".png")


def order_and_shape(wc):
    return bidi.algorithm.get_display(arabic_reshaper.reshape(wc[0])), wc[1]


def bad_unicode(wc):
    w = wc[0]
    if not isinstance(w, unicode):
        w = unicode(w)
    prev_surrogate = False
    for _ch in w:
        if sys.maxunicode == 0xffff and (0xD800 <= ord(_ch) <= 0xDBFF):
            prev_surrogate = _ch
            continue
        elif prev_surrogate:
            _ch = prev_surrogate + _ch
            prev_surrogate = False
        if unicodedata.bidirectional(_ch) == '':
            return False
    return True


if __name__ == "__main__":
    host = "data.enalytica.com"
    port = 27017

    mongo = pymongo.MongoClient(host, port)
    db = mongo.stage
    db.authenticate("admin", os.environ['ENALYTICA_MONGO_PWD'])

    collection = db['nodes']
    query = {"group": 9}
    counts = count_hashtags(collection, query)
    cloud_file(counts, "test")
