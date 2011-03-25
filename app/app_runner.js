  function Fetcher(el, path, delay){
    if (!delay){ delay = 2000; }
    var fetcher = this;
    this.el = el; this.delay = delay, this.render = false;
    this.update = function(data){
      if (!data){ return; }
      fetcher.el.empty();
      $.each(data, function(num, el){
        if (fetcher.render){ var update = fetcher.render(num, el); }
        else { var update = $("<span>", {class: "load", id: "le-"+num, html: el}); }
        fetcher.el.append(update);
      });
    };
    this.reload = function(){
      clearTimeout(fetcher.timeout);
      $.getJSON((path + "?tm="+Date.now()), function(data){
        fetcher.update(data);
        fetcher.timeout = setTimeout(fetcher.reload, fetcher.delay);
      });
    };
    this.timeout = setTimeout(this.reload, 0);
  }
  
  $(function(){
    var load =      new Fetcher($('#load .data'), '/load',      1000 * 5);
    var uptime =    new Fetcher($('#uptime'),     '/uptime',    1000 * 60 * 30);
    var processes = new Fetcher($('.proc_list'),  '/processes', 750);
    processes.render = function(num, el){
      var list = $("<tr>", {class:"proc_list"});
      for (prop in el){
        list.append($("<td>", {class:'process ps-'+prop, html: el[prop]}));
      }
      return list;
    }
    load.update_orig = load.update;
    load.update = function(data){
      if (!window.runs){ window.runs = 0 } else { window.runs++; }
      load.el = $("#lavg");
      load.update_orig(data.avg);
      $('#proc-num')
        .html($("<span>", {class:'proc_txt', html:"Active Processes: "}))
        .append($("<span>", {class:'running_proc', html:data.proc_num.running}))
        .append($("<span>", {html: "/"}))
        .append($("<span>", {class:"total_proc", html: data.proc_num.total}));
    }
    uptime.update = function(data){
      $('#uptime').html("Up for " + data.days + " days, " + data.hours + ":" + data.mins + "." + data.secs);
      if(!uptime.raw_sec){
        uptime.updatei = setInterval(uptime.display, 1000);
        uptime.raw_sec = data.tsec;
      }
    }
    uptime.display = function(){
      var t = {}, u = {};
      t.tsec = uptime.raw_sec++;
      t.secs = (u.secs = t.tsec) % 60;
      t.mins = (u.mins = (u.secs / 60)) % 60;
      t.hours = (u.hours = (u.mins / 60)) % 24;
      t.days = (u.hours / 24);
      for (el in t){ t[el] = Math.floor(t[el]); }
      uptime.update(t);
    }
  });
