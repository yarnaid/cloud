from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
import os
import json


app = Flask(__name__)


@app.route('/')
def index():
    # request[]
    return render_template('base.html', context={'debug_text': os.getcwd()})


@app.route('/ajax_get_answers', methods=["GET", "POST"])
def ajax_get_answers():
    if request.method == 'POST':
        print request.args.get('id')
        id = request.args.get('id', type=str)
        with open('./static/data/lex.json') as f:
            data = json.load(f)
        res = jsonify(result=data[id])
        print data[id]
        return res

if __name__ == '__main__':
    app.debug = True
    app.run()
