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
            var date = new Date ( '20' + day[1] + '-' + day[2] + '-' + day[3] + ' ' + utc[1] + ':' + utc[2] + ':' + utc[3] + '+00:00');
            var result = '{ \"date\": \"' + date + '\"';
            var lat = -1;
            var lon = -1;
            if ( data.split(',')[2] == 'A' ) {
              lat = data.split(',')[3].match(/^(\d{2,3})(\d{2})\.(\d{4})$/);
              var lat2 = Math.round((lat[2] + lat[3])*100/60);
              lat = lat[1] + '.' + lat2;
              result += ', \"lat-dir\": \"' + data.split(',')[4] + '\", \"lat\": ' + lat;

              lon = data.split(',')[5].match(/^(\d{1,3})(\d{2})\.(\d{4})$/);
              var lon2 = Math.round((lon[2] + lon[3])*100/60);
              lon = lon[1] + '.' + lon2;
              result += ', \"lon-dir\": \"' + data.split(',')[6] + '\", \"lon\": ' + lon;
            }
            result += ' }';
            if(node.topic !== undefined && node.topic != "") msg.topic=node.topic;
            msg.payload = {
		    "date" : date,
		    "epoch-time" : Date.parse(date) / 1000,
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

