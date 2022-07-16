function WaterRipple (element, settings) {
  // 默认设置
  var defaults = {
    image: '/imgs/bg-cover.jpeg',
    dropRadius: 3,  // 波源半径大小
    width: 400,
    height: 400,
    delay: 1,
    attenuation: 5,
    maxAmplitude: 1024,
    sourceAmplitude: 512, // 震源振幅
    auto: !0
  };
  // 合并设置
  for (var item in defaults) {
    if (!settings.hasOwnProperty(item)) {
      settings[item] = defaults[item]
    }
  }

  // 检测背景图
  if (!settings.image.length) {
    return false;
  }

  var width = settings.width,
    height = settings.height,
    dropRadius = settings.dropRadius,
    delay = settings.delay * 1000,
    attenuation = settings.attenuation,  // 衰减级别
    maxAmplitude = settings.maxAmplitude,  // 最大振幅
    sourceAmplitude = settings.sourceAmplitude,
    half_width = width >> 1,
    half_height = height >> 1,
    amplitude_size = width * (height + 2) * 2,
    old_index = width,
    new_index = width * (height + 3),
    map_index,  // 振幅数组索引
    texture,   // 原始图像像素信息
    ripple,    // 参数波纹的图像像素信息
    image,  // Image对象
    autoRepeat, // 自动产生波源的重复事件
    ripple_map = [],
    last_map = [];

  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.zIndex = 2;
  element.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = settings.bgColor;
  // ctx.fillRect(0, 0, width, height);
  window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  // 加载图片
  function loadImage () {
    image = new Image();
    image.src = settings.image;
    image.onload = function () {
      init();
    }
  }

  // 保存图像的所有像素信息
  function saveImageData () {
    // 在canvas中绘制图形
    ctx.drawImage(image, 0, 0, 1920, 1080, 0, 0, window.innerWidth, window.innerHeight);
    // 图像的ImageData对象
    texture = ctx.getImageData(0, 0, width, height);
    ripple = ctx.getImageData(0, 0, width, height);
  }

  function init () {
    saveImageData();
    // 波幅数组初始化为0
    for (var i = 0; i < amplitude_size; i++) {
      ripple_map[i] = last_map[i] = 0;
    }

    animate();
    // 如果设置了自动产生波源，则随机参数波源
    if (settings.auto) {
      autoRepeat = setInterval(function () {
        disturb(Math.random() * width, Math.random() * height);
      }, delay);
      disturb(Math.random() * width, Math.random() * height);
    }

  }

  // 动画主循环
  function animate () {
    requestAnimationFrame(animate);
    renderRipple();
  }

  // 在指定地点产生波源
  function disturb (circleX, circleY) {
    // 将值向下取整
    circleX <<= 0;
    circleY <<= 0;
    var maxDistanceX = circleX + dropRadius,
      maxDistanceY = circleY + dropRadius;
    for (var y = circleY - dropRadius; y < maxDistanceY; y++) {
      for (var x = circleX - dropRadius; x < maxDistanceX; x++) {
        ripple_map[old_index + y * width + x] += sourceAmplitude;
      }
    }
  }

  // 渲染下一帧
  function renderRipple () {
    var i = old_index,
      deviation_x,  // x水平方向偏移
      deviation_y,  // y竖直方向偏移
      pixel_deviation, // 偏移后的ImageData对象像素索引
      pixel_source;  // 原始ImageData对象像素索引

    // 交互索引 old_index, new_index
    old_index = new_index;
    new_index = i;

    // 设置像素索引和振幅索引
    i = 0;
    map_index = old_index;

    // 使用局部变量优化全局作用域查询
    var _map_index = map_index,
      _width = width,
      _height = height,
      _half_width = half_width,
      _half_height = half_height,
      _ripple_map = ripple_map,
      _last_map = last_map,
      _ripple_data = ripple.data,  // 引用修改
      _texture_data = texture.data, // 引用修改
      _new_index = new_index,
      _attenuation = attenuation,
      _maxAmplitude = maxAmplitude;


    // 渲染所有像素点
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < _width; x++) {
        var x_boundary = 0, judge = _map_index % _width;
        if (judge == 0) {
          x_boundary = 1; // 左边边界
        } else if (judge == _width - 1) {
          x_boundary = 2; // 右边边界
        }
        var top = _ripple_map[_map_index - _width],// 上边的相邻点
          bottom = _ripple_map[_map_index + _width],// 下边的相邻点
          left = x_boundary != 1 ? _ripple_map[_map_index - 1] : 0,// 左边的相邻点
          right = x_boundary != 2 ? _ripple_map[_map_index + 1] : 0;// 右边的相邻点
        // 计算当前像素点下一时刻的振幅
        var amplitude = (top + bottom + left + right) >> 1;
        amplitude -= _ripple_map[_new_index + i];
        amplitude -= amplitude >> _attenuation;  // 计算衰减

        // 更新振幅数组
        _ripple_map[_new_index + i] = amplitude;

        amplitude = _maxAmplitude - amplitude;
        var old_amplitude = _last_map[i];
        _last_map[i] = amplitude;

        if (old_amplitude != amplitude) {
          deviation_x = (((x - _half_width) * amplitude / _maxAmplitude) << 0) + _half_width;
          deviation_y = (((y - _half_height) * amplitude / _maxAmplitude) << 0) + _half_height;

          // 检查边界
          if (deviation_x > _width) {
            deviation_x = _width - 1;
          }
          if (deviation_x < 0) {
            deviation_x = 0;
          }
          if (deviation_y > _height) {
            deviation_y = _height - 1;
          }
          if (deviation_y < 0) {
            deviation_y = 0;
          }

          pixel_source = i * 4;
          pixel_deviation = (deviation_x + (deviation_y * width)) * 4;

          // 移动像素的RGBA信息
          _ripple_data[pixel_source] = _texture_data[pixel_deviation];
          _ripple_data[pixel_source + 1] = _texture_data[pixel_deviation + 1];
          _ripple_data[pixel_source + 2] = _texture_data[pixel_deviation + 2];
          //                        ripple.data[pixel_source + 3] = texture.data[pixel_deviation + 3];
        }
        ++i;
        ++_map_index;
      }
    }
    map_index = _map_index;
    ctx.putImageData(ripple, 0, 0);
  }

  function calculAmplitude (index, old_amplitude) {
    var x_boundary = 0, judge = map_index % width;
    if (judge == 0) {
      x_boundary = 1; // 左边边界
    } else if (judge == width - 1) {
      x_boundary = 2; // 右边边界
    }
    var top = ripple_map[index - width],// 上边的相邻点
      bottom = ripple_map[index + width],// 下边的相邻点
      left = x_boundary != 1 ? ripple_map[index - 1] : 0,// 左边的相邻点
      right = x_boundary != 2 ? ripple_map[index + 1] : 0;// 右边的相邻点
    // 计算当前像素点下一时刻的振幅
    var amplitude = top + bottom + left + right;
    amplitude >>= 1;
    amplitude -= old_amplitude;
    amplitude -= amplitude >> attenuation;  // 计算衰减
    return amplitude;
  }

  this.disturb = function (a, b) {
    disturb(a, b);
  };
  loadImage();
  return this;
}

function init (id) {

  //Settings - params for WaterRippleEffect
  var settings = {
    image: '/imgs/bg-cover.jpeg',//image path
    dropRadius: 3,//radius of the ripple
    width: document.getElementById(id).offsetWidth,//width
    height: document.getElementById(id).offsetHeight,//height
    delay: 1,//if auto param === true. 1 === 1 second delay for animation
    auto: 1//if auto param === true, animation starts on it´s own
  };

  //init
  var waterRippleEffect = new WaterRipple(document.getElementById(id), settings);
  // document.getElementById(id).style.cursor = 'pointer';

  //on click
  document.getElementById(id).addEventListener('click', function (e) {
    var mouseX = e.layerX;
    var mouseY = e.layerY;
    waterRippleEffect.disturb(mouseX, mouseY);
  });


  //on mousemove
  // document.getElementById(id).addEventListener('mousemove', function (e) {
  //   var mouseX = e.layerX;
  //   var mouseY = e.layerY;
  //   waterRippleEffect.disturb(mouseX, mouseY);
  // });

  document.onkeydown = function (e) {
    var event = e || window.event || arguments.callee.caller.arguments[0];
    if (event && event.keyCode == 13) { // enter 键
      waterRippleEffect.disturb(200, 200);
    }
  }
}
