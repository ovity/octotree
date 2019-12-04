function isSafari() {
  return typeof safari !== 'undefined' && safari.self && typeof safari.self.addEventListener === 'function';
}

function isValidTimeStamp(timestamp) {
  return !isNaN(parseFloat(timestamp)) && isFinite(timestamp);
}

window.isSafari = isSafari;
window.isValidTimeStamp = isValidTimeStamp;
