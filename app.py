from flask import Flask, render_template, request
import backend

app = Flask(__name__)


@app.route('/')
@app.route('/index')
def index():
    #Change this later to include html details
    return render_template('Project/public/index.html')


if __name__ == '__main__':
    app.run()
