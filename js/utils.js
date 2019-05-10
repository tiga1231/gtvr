let utils = {};

utils.label2color = d3.schemeCategory10;
function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16)/255,
    parseInt(result[2], 16)/255,
    parseInt(result[3], 16)/255
  ];
}
utils.label2color = utils.label2color.map((d)=>(hexToRgb(d)));


utils.cache = {};
utils.loadDataBin = function(url, callback) {
  if(url in utils.cache){
    callback(utils.cache[url], url);
  }else{
    let xhr = new window.XMLHttpRequest();
    let ready = false;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 
          && xhr.status === 200
          && ready !== true) {
        if (xhr.responseType === 'arraybuffer') {
          utils.cache[url] = xhr.response;
          callback(xhr.response, url);
        } else if (xhr.mozResponseArrayBuffer !== null) {
          utils.cache[url] = xhr.mozResponseArrayBuffer;
          callback(xhr.mozResponseArrayBuffer, url);
        } else if (xhr.responseText !== null) {
          let data = String(xhr.responseText);
          let ary = new Array(data.length);
          for (let j = 0; j<data.length; j++) {
            ary[j] = data.charCodeAt(j) & 0xff;
          }
          let uint8ay = new Uint8Array(ary);
          utils.cache[url] = uint8ay.buffer;
          callback(uint8ay.buffer, url);
        }
        ready = true;
      }
    };
    xhr.open('GET', url, true);
    xhr.responseType='arraybuffer';
    xhr.send();
    }
};


utils.reshape = function(array, shape) {
  let res = [];
  if (shape.length == 2) {
    for (let row=0; row<shape[0]; row++) {
      res.push([]);
      for (let col=0; col<shape[1]; col++) {
        res[res.length-1].push(array[shape[1] * row + col]);
      }
    }
  } else {
    let blocksize = math.prod(shape.slice(1));
    for (let i=0; i<shape[0]; i++) {
      res.push(
        utils.reshape(array.slice(i*blocksize, (i+1)*blocksize), shape.slice(1))
      );
    }
  }
  return res;
};
