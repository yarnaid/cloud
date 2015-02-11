from flask import Flask
from flask import render_template
from flask import request
import os


app = Flask(__name__)

@app.route('/')
def index():
    # request[]
    return render_template('base.html', context={'debug_text': os.getcwd()})

if __name__ == '__main__':
    app.debug = True
    app.run()