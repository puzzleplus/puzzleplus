# List available puzzles.
import logging

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

class ListPuzzlesPage(webapp.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.headers['Access-Control-Allow-Origin'] = '*'
    logging.info('Request origin: %s' % self.request.headers['Origin'])
    # e.g. 'http://www.corp.google.com'

    self.response.out.write('Line 1\n')
    self.response.out.write('Line 2\n')

application = webapp.WSGIApplication(
                                     [('/listpuzzles', ListPuzzlesPage)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
