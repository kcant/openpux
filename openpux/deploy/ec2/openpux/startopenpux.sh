
DEPLOY=/home/ec2-user/Smartpux/openpux

cd $DEPLOY/deploy/ec2/openpux

forever start -a --uid "openpux" -c sh openpux.sh
