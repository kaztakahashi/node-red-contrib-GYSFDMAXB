module.exports = function(RED) {
    function NodeGYSFDMAXB(config) {
      RED.nodes.createNode(this,config);
      var node = this;
      node.on('input', function(msg) {
        var serialPort = require('serialport');
        var Readline = serialPort.parsers.Readline;
        var port = new serialPort('/dev/serial0', {
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
            var date = new Date ( '20' + day[1] + '-' + day[2] + '-' + day[3] + ' ' + utc[1] + ':' + utc[2] + ':' + utc[3] + '+00:00');
            var result = '{ \"date\": \"' + date + '\"';
            var lat = '00.0000';
            var lon = '00.0000';
            if ( data.split(',')[2] == 'A' ) {
              lat = data.split(',')[3].match(/^(\d{1,3})(\d{2})\.(\d{4})$/);
              var lat2 = lat[2] + Math.round(lat[3]/60);
              lat = lat[1] + '.' + lat2;
              result += ', \"lat-dir\": \"' + data.split(',')[4] + '\", \"lat\": ' + lat;

              lon = data.split(',')[5].match(/^(\d{1,3})(\d{2})\.(\d{4})$/);
              var lon2 = lon[2] + Math.round(lon[3]/60);
              lon = lon[1] + '.' + lon2;
              result += ', \"lon-dir\": \"' + data.split(',')[6] + '\", \"lon\": ' + lon;
            }
            result += ' }';
            msg.payload = {
		    "date" : date,
		    "lat-dir" : data.split(',')[4],
		    "lat" : lat,
		    "lon-dir" : data.split(',')[6],
		    "lon" : lon
	    }
            console.log(result);
            node.send(msg);
            if ( date != null ) {
              port.close();
            }
	  }
        });

      });
    }
    RED.nodes.registerType("GYSFDMAXB",NodeGYSFDMAXB);
}

