import cgi
from crossword import Crossword
from django.utils import simplejson

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app


class ConvertPage(webapp.RequestHandler):
  def post(self):
    x = self.request.get('puz')
    c = Crossword.FromString(x)

    answers = ""
    for y in range(0, c.height):
      for x in range(0, c.width):
        sq = c.squares[x][y]
        if sq:
          answers += sq.char
        else:
          answers += ","

    nums = [ [None for y in range(0, c.height)] for x in range(0, c.width)]
    for y in range(0, c.height):
      for x in range(0, c.width):
        sq = c.squares[x][y]
        if sq: nums[x][y] = sq.number() or 0
        else:  nums[x][y] = 0

    cross_hash = {
        'title': c.title,
        'author': c.author,
        'copyright': c.copyright,
        'width': c.width,
        'height': c.height,
        'answer': answers,
        'numbers': nums,
        'down': [ [num, c.down[num]] for num in sorted(c.down.keys()) ],
        'across': [ [num, c.across[num]] for num in sorted(c.across.keys()) ]
        }

    self.response.headers['Content-Type'] = 'text/plain'
    out = self.response.out
    out.write("var Crossword = ")
    out.write(simplejson.dumps(cross_hash))
    out.write(";")


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
