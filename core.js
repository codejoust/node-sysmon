var sys = require('sys'),
    fs  = require('fs'),
    http= require('http'),
    url = require('url'),
    path= require('path'),
    exec = require('child_process').exec;
    
var uptime = function(callback){
    fs.readFile('/proc/uptime', "r",  function(err, data){
        var upsec = parseInt(data.split(/ /)[0]);
        var t = {}, u = {};
        t.tsec = upsec;
        t.secs = (u.secs = upsec) % 60;
        t.mins = (u.mins = (u.secs / 60)) % 60;
        t.hours = (u.hours = (u.mins / 60)) % 24;
        t.days = (u.hours / 24);
        for (el in t){ t[el] = Math.floor(t[el]); }
        callback(t);
    });
}, load = function(callback){
    fs.readFile('/proc/loadavg', "r", function(err, data){
        data = data.split(' ');
        var proc = data.slice(0, 3);
        var ad = data[3].split('/');
        var amt = {
            running: ad[0],
            total: ad[1]
        };
        callback({"avg": proc, "proc_num": amt});
    });
}, top_processes = function(callback, max_lines){
    if (!max_lines){ max_lines = 10; }
    var ps = exec('ps -e --sort=%cpu -o %cpu,%mem,pid,user,fname  | tail --lines '+max_lines,
        function(err, stdout, stderr){
            var ps_raw = (' ' + stdout).split("\n").slice(1, max_lines).reverse();
            var processes = [];
            for (var i = 0; i < ps_raw.length; i++){
                var proc = ps_raw[i].split(/ +/);
                if (proc[0] == ''){ proc.shift(); }
                processes.push({
                    pnm: proc[4],
                    cpu: proc[0],
                    mem: proc[1],
                    pid: proc[2],
                    usr: proc[3]
                });
            }
            callback(processes);
        });
}, resp = function(runnable, res, type, resp_code){
    if (!resp_code){ resp_code = 200; }
    if (!type){ type = 'text/html'; }
    var handle_response = function(data){
        res.writeHead(resp_code, {'Content-Length': data.length,
                                  'Content-Type':   type});
        res.write(data, 'binary');
        res.end()
    };
    if (typeof(runnable) != 'function'){
        handle_response(runnable);
    } else {
        runnable(function(data){
            handle_response(data);            
        });
    }
}, render_file = function(file, res, code){
    if(!code){ code = 200; }
    fs.readFile(file, "binary", function(err, data){
        if (!err && data.length > 0){
            resp(data, res, get_type(path.extname(file)), code);
        } else {
            resp("Error!", res, 'text/plain', 500);
        }
    });
}, render_json = function(data, res){
    var json = JSON.stringify(data);
    res.writeHead(200, {'Content-Length': json.length,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, must-revalidate'});
    res.end(json);
}, get_type = function(ext){
    var types = {
        'js': 'text/javascript',
        'htm': 'text/html',
        'txt': 'text/plain',
        'html': 'text/html',
        'jpg': 'image/jpg',
        'png': 'image/png',
        'css': 'text/css',
        'ico': 'image/x-icon'
    }
    var type = ext.slice(1);
    if (type in types){
        return types[type];
    } else { return "text/plain"; }
};
exports.die = function(str){
    sys.puts(str); process.exit(-1);
};
exports.start_server = function(port){
    http.createServer(function(req, res){
        var requrl = url.parse(req.url, true);
        switch(requrl.pathname){
            case '/':
              render_file("app/main.html", res);
            break;
            case '/load':
              load(function(data){
                render_json(data, res);
              });
            break;
            case '/uptime':
              uptime(function(data){
                render_json(data, res);
              });
            break;
            case '/processes':
               var num = (('query' in url) && parseInt(url.query.num) > 1) ? parseInt(url.query.num) : 10;
               top_processes(function(data){
                   render_json(data, res);
               }, num);
            break;
            default:
                var page = path.join(__dirname, 'app',path.normalize(requrl.pathname));
                path.exists(page, function(val){
                    val ? render_file(page, res) : render_file(path.join(__dirname, 'app', '404.html'), res, 404);
                });
            break;
        }
    }).listen(port);
    return true;
}

