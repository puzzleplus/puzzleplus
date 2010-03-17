#!/bin/bash
base=$1;
echo Setting include base to "$base"...
perl -i -pe 's,(type="text/css" href=").*(/crossword\.css"/>),$1'$base'$2,g' wave/lmnowave.xml

perl -i -pe 's,(<script src=").*(/[^/]*\.js"></script>),$1'$base'$2,g' wave/lmnowave.xml

perl -i -pe 's,((?:thumbnail|screenshot)=").*(/[^/]*\.png"),$1'$base'$2,g' wave/lmnowave.xml
