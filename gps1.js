module.exports = function(RED) {
    function NodeGYSFDMAXB(config) {
      RED.nodes.createNode(this,config);
      var node = this;
      node.topic = config.topic || "";

      node.on('input', function(msg) {
        var serialPort = require('serialport');
        var Readline = serialPort.parsers.Readline;
        var port = new serialPort(config.port, {
          baudRate: 9600,
          dataBits: 8,
          parity: 'none',
          stopBits: 1,
          flowControl: false
        });
        var sp = new Readline();
        port.pipe(sp);

        sp.on('open', function (err) {
          console.log('serialPort: Port open');
        });

        sp.on('data', function (data) {
          if (data.indexOf('$GPRMC') !== -1) {
            var day = data.split(',')[9].match(/^(\d{2})(\d{2})(\d{2})$/);
            var utc = data.split(',')[1].match(/^(\d{2})(\d{2})(\d{2})\.\d{3}$/);
            var date = new Date ( '20' + day[3] + '-' + day[2] + '-' + day[1] + ' ' + utc[1] + ':' + utc[2] + ':' + utc[3] + '+00:00');
            var result = '{ \"date\": \"' + date + '\"';
            var lat;
            var lon;
            var message;
            if ( data.split(',')[2] == 'A' ) {
              lat = data.split(',')[3].match(/^(\d{2,3})(\d{2})\.(\d{4})$/);
              var lat2 = Math.round((lat[2] + lat[3])*100/60);
              lat = lat[1] + '.' + lat2;
              result += ', \"latDir\": \"' + data.split(',')[4] + '\", \"lat\": ' + lat;
              if ( data.split(',')[4] === "S" ) {
		      lat = -lat;
	      }

              lon = data.split(',')[5].match(/^(\d{1,3})(\d{2})\.(\d{4})$/);
              var lon2 = Math.round((lon[2] + lon[3])*100/60);
              lon = lon[1] + '.' + lon2;
              result += ', \"lonDir\": \"' + data.split(',')[6] + '\", \"lon\": ' + lon;
              if ( data.split(',')[6] === "W" ) {
		      lon = -lon;
	      }
            }
            result += ' }';
            if ( node.topic !== undefined && node.topic != "" ) msg.topic=node.topic;

            if ( lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180 ) {
              message = 'A GPS receiver works but it has no signal or weak signal.';
              if ( lat < -90 || lat > 90 || lon < -180 || lon > 180 ) {
                lat;
                lon;
	      };
            };
            msg.payload = {
		    'date' : date,
		    'epochTime' : Date.parse(date) / 1000,
		    'lat' : lat,
		    'lon' : lon,
		    'message' : message
	    }
            console.log(result);
            node.send(msg);
            if ( date != null ) {
              port.close();
            }
	  }
        });

	setTimeout( () => {
          if ( port.isOpen ) {
            port.close();
            var newdate = new Date();
            var date = newdate.getTime();
            msg.payload = {
		    'epochTime' : Math.floor ( date / 1000 ),
		    'message' :'A GPS receiver is not connected or does not work.'
	    }
            console.log('timed out');
            if ( node.topic !== undefined && node.topic != "" ) msg.topic = node.topic;
            node.send(msg);
	  };
	},10000);

      });
    }
    RED.nodes.registerType("GYSFDMAXB",NodeGYSFDMAXB);
}

