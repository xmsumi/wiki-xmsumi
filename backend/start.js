const path = require('path');
const Module = require('module');

// 设置路径别名解析
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    const newRequest = request.replace('@/', path.join(__dirname, 'dist/'));
    return originalResolveFilename.call(this, newRequest, parent, isMain);
  }
  return originalResolveFilename.call(this, request, parent, isMain);
};

// 启动应用
require('./dist/index.js');