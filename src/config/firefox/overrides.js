(() => {
  Adapter.prototype.downloadFile = function(path, fileName){
    const link = document.createElement('a')
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + path.replace(/\/blob\//, '/raw/'))
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
  };
})();