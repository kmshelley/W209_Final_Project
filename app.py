from flask import Flask
from campaign_finance_viz_api import viz_api
from syria_twitter.syria_twitter_api import syria_api


app = Flask(__name__)

# Enable CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'accept-language, origin, accept-encoding, cache-control, content-type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response



app.register_blueprint(viz_api)
app.register_blueprint(syria_api)


if __name__ == "__main__":
    app.run()
