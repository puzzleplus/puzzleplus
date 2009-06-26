import cgi
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

class ConvertPage(webapp.RequestHandler):
  def post(self):
    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write("\n<pre>")
    self.response.out.write(cgi.escape(self.request.get('puz')))
    self.response.out.write("\n</pre>")

  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    print "blah"
    self.response.out.write('Hello, webapp World!')
    self.response.out.write(self.request.post('file'))

class MainPage(webapp.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write("""
<html>
<head>
  <title>Test JS .puz parser</title>
</head>

<body>
  <form action="/convert" method="post" enctype="multipart/form-data">
  <input type="file" name="puz"><br/>
  <input type="submit" value="Convert">
  </form>
</body>
</html>
""")

application = webapp.WSGIApplication( [('/', MainPage),
                                       ('/convert', ConvertPage)
                                      ],
                                      debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
