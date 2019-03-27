/* eslint-disable */
var Module = function(Module) {
    Module = Module || {};

    var Module = typeof Module !== 'undefined' ? Module : {};
    var moduleOverrides = {};
    var key;
    for (key in Module) {
        if (Module.hasOwnProperty(key)) {
            moduleOverrides[key] = Module[key];
        }
    }
    Module['arguments'] = [];
    Module['thisProgram'] = './this.program';
    Module['quit'] = function(status, toThrow) {
        throw toThrow;
    };
    Module['preRun'] = [];
    Module['postRun'] = [];
    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    if (Module['ENVIRONMENT']) {
        if (Module['ENVIRONMENT'] === 'WEB') {
            ENVIRONMENT_IS_WEB = true;
        } else if (Module['ENVIRONMENT'] === 'WORKER') {
            ENVIRONMENT_IS_WORKER = true;
        } else if (Module['ENVIRONMENT'] === 'NODE') {
            ENVIRONMENT_IS_NODE = true;
        } else if (Module['ENVIRONMENT'] === 'SHELL') {
            ENVIRONMENT_IS_SHELL = true;
        } else {
            throw new Error("Module['ENVIRONMENT'] value is not valid. must be one of: WEB|WORKER|NODE|SHELL.");
        }
    } else {
        ENVIRONMENT_IS_WEB = typeof window === 'object';
        ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
        ENVIRONMENT_IS_NODE =
            typeof process === 'object' &&
            typeof require === 'function' &&
            !ENVIRONMENT_IS_WEB &&
            !ENVIRONMENT_IS_WORKER;
        ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    }
    if (ENVIRONMENT_IS_NODE) {
        var nodeFS;
        var nodePath;
        Module['read'] = function shell_read(filename, binary) {
            var ret;
            if (!nodeFS) nodeFS = require('fs');
            if (!nodePath) nodePath = require('path');
            filename = nodePath['normalize'](filename);
            ret = nodeFS['readFileSync'](filename);
            return binary ? ret : ret.toString();
        };
        Module['readBinary'] = function readBinary(filename) {
            var ret = Module['read'](filename, true);
            if (!ret.buffer) {
                ret = new Uint8Array(ret);
            }
            assert(ret.buffer);
            return ret;
        };
        if (process['argv'].length > 1) {
            Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
        }
        Module['arguments'] = process['argv'].slice(2);
        process['on']('uncaughtException', function(ex) {
            if (!(ex instanceof ExitStatus)) {
                throw ex;
            }
        });
        process['on']('unhandledRejection', function(reason, p) {
            process['exit'](1);
        });
        Module['inspect'] = function() {
            return '[Emscripten Module object]';
        };
    } else if (ENVIRONMENT_IS_SHELL) {
        if (typeof read != 'undefined') {
            Module['read'] = function shell_read(f) {
                return read(f);
            };
        }
        Module['readBinary'] = function readBinary(f) {
            var data;
            if (typeof readbuffer === 'function') {
                return new Uint8Array(readbuffer(f));
            }
            data = read(f, 'binary');
            assert(typeof data === 'object');
            return data;
        };
        if (typeof scriptArgs != 'undefined') {
            Module['arguments'] = scriptArgs;
        } else if (typeof arguments != 'undefined') {
            Module['arguments'] = arguments;
        }
        if (typeof quit === 'function') {
            Module['quit'] = function(status, toThrow) {
                quit(status);
            };
        }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
        Module['read'] = function shell_read(url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.send(null);
            return xhr.responseText;
        };
        if (ENVIRONMENT_IS_WORKER) {
            Module['readBinary'] = function readBinary(url) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                xhr.responseType = 'arraybuffer';
                xhr.send(null);
                return new Uint8Array(xhr.response);
            };
        }
        Module['readAsync'] = function readAsync(url, onload, onerror) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function xhr_onload() {
                if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                    onload(xhr.response);
                    return;
                }
                onerror();
            };
            xhr.onerror = onerror;
            xhr.send(null);
        };
        if (typeof arguments != 'undefined') {
            Module['arguments'] = arguments;
        }
        Module['setWindowTitle'] = function(title) {
            document.title = title;
        };
    }
    Module['print'] =
        typeof console !== 'undefined' ? console.log.bind(console) : typeof print !== 'undefined' ? print : null;
    Module['printErr'] =
        typeof printErr !== 'undefined'
            ? printErr
            : (typeof console !== 'undefined' && console.warn.bind(console)) || Module['print'];
    Module.print = Module['print'];
    Module.printErr = Module['printErr'];
    for (key in moduleOverrides) {
        if (moduleOverrides.hasOwnProperty(key)) {
            Module[key] = moduleOverrides[key];
        }
    }
    moduleOverrides = undefined;
    var STACK_ALIGN = 16;
    function staticAlloc(size) {
        assert(!staticSealed);
        var ret = STATICTOP;
        STATICTOP = (STATICTOP + size + 15) & -16;
        return ret;
    }
    function alignMemory(size, factor) {
        if (!factor) factor = STACK_ALIGN;
        var ret = (size = Math.ceil(size / factor) * factor);
        return ret;
    }
    var functionPointers = new Array(0);
    var GLOBAL_BASE = 1024;
    var ABORT = 0;
    var EXITSTATUS = 0;
    function assert(condition, text) {
        if (!condition) {
            abort('Assertion failed: ' + text);
        }
    }
    var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
    var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
    var WASM_PAGE_SIZE = 65536;
    var ASMJS_PAGE_SIZE = 16777216;
    function alignUp(x, multiple) {
        if (x % multiple > 0) {
            x += multiple - (x % multiple);
        }
        return x;
    }
    var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    function updateGlobalBuffer(buf) {
        Module['buffer'] = buffer = buf;
    }
    function updateGlobalBufferViews() {
        Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
        Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
        Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
        Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
        Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
        Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
        Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
        Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
    }
    var STATIC_BASE, STATICTOP, staticSealed;
    var STACK_BASE, STACKTOP, STACK_MAX;
    var DYNAMIC_BASE, DYNAMICTOP_PTR;
    STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
    staticSealed = false;
    function enlargeMemory() {
        return false;
    }
    var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
    var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
    if (TOTAL_MEMORY < TOTAL_STACK)
        Module.printErr(
            'TOTAL_MEMORY should be larger than TOTAL_STACK, was ' +
                TOTAL_MEMORY +
                '! (TOTAL_STACK=' +
                TOTAL_STACK +
                ')',
        );
    if (Module['buffer']) {
        buffer = Module['buffer'];
    } else {
        if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
            Module['wasmMemory'] = new WebAssembly.Memory({
                initial: TOTAL_MEMORY / WASM_PAGE_SIZE,
                maximum: TOTAL_MEMORY / WASM_PAGE_SIZE,
            });
            buffer = Module['wasmMemory'].buffer;
        } else {
            buffer = new ArrayBuffer(TOTAL_MEMORY);
        }
        Module['buffer'] = buffer;
    }
    updateGlobalBufferViews();
    function getTotalMemory() {
        return TOTAL_MEMORY;
    }
    HEAP32[0] = 1668509029;
    HEAP16[1] = 25459;
    if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw 'Runtime error: expected the system to be little-endian!';
    function callRuntimeCallbacks(callbacks) {
        while (callbacks.length > 0) {
            var callback = callbacks.shift();
            if (typeof callback == 'function') {
                callback();
                continue;
            }
            var func = callback.func;
            if (typeof func === 'number') {
                if (callback.arg === undefined) {
                    Module['dynCall_v'](func);
                } else {
                    Module['dynCall_vi'](func, callback.arg);
                }
            } else {
                func(callback.arg === undefined ? null : callback.arg);
            }
        }
    }
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATMAIN__ = [];
    var __ATEXIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    var runtimeExited = false;
    function preRun() {
        if (Module['preRun']) {
            if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
            while (Module['preRun'].length) {
                addOnPreRun(Module['preRun'].shift());
            }
        }
        callRuntimeCallbacks(__ATPRERUN__);
    }
    function ensureInitRuntime() {
        if (runtimeInitialized) return;
        runtimeInitialized = true;
        callRuntimeCallbacks(__ATINIT__);
    }
    function preMain() {
        callRuntimeCallbacks(__ATMAIN__);
    }
    function exitRuntime() {
        callRuntimeCallbacks(__ATEXIT__);
        runtimeExited = true;
    }
    function postRun() {
        if (Module['postRun']) {
            if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
            while (Module['postRun'].length) {
                addOnPostRun(Module['postRun'].shift());
            }
        }
        callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
        __ATPRERUN__.unshift(cb);
    }
    function addOnPostRun(cb) {
        __ATPOSTRUN__.unshift(cb);
    }
    var Math_abs = Math.abs;
    var Math_cos = Math.cos;
    var Math_sin = Math.sin;
    var Math_tan = Math.tan;
    var Math_acos = Math.acos;
    var Math_asin = Math.asin;
    var Math_atan = Math.atan;
    var Math_atan2 = Math.atan2;
    var Math_exp = Math.exp;
    var Math_log = Math.log;
    var Math_sqrt = Math.sqrt;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_pow = Math.pow;
    var Math_imul = Math.imul;
    var Math_fround = Math.fround;
    var Math_round = Math.round;
    var Math_min = Math.min;
    var Math_max = Math.max;
    var Math_clz32 = Math.clz32;
    var Math_trunc = Math.trunc;
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    function addRunDependency(id) {
        runDependencies++;
        if (Module['monitorRunDependencies']) {
            Module['monitorRunDependencies'](runDependencies);
        }
    }
    function removeRunDependency(id) {
        runDependencies--;
        if (Module['monitorRunDependencies']) {
            Module['monitorRunDependencies'](runDependencies);
        }
        if (runDependencies == 0) {
            if (runDependencyWatcher !== null) {
                clearInterval(runDependencyWatcher);
                runDependencyWatcher = null;
            }
            if (dependenciesFulfilled) {
                var callback = dependenciesFulfilled;
                dependenciesFulfilled = null;
                callback();
            }
        }
    }
    Module['preloadedImages'] = {};
    Module['preloadedAudios'] = {};
    var dataURIPrefix = 'data:application/octet-stream;base64,';
    function isDataURI(filename) {
        return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
    }
    function integrateWasmJS() {
        var wasmTextFile = 'mcl_c.wast';
        var wasmBinaryFile = 'mcl_c.wasm';
        var asmjsCodeFile = 'mcl_c.temp.asm.js';
        if (typeof Module['locateFile'] === 'function') {
            if (!isDataURI(wasmTextFile)) {
                wasmTextFile = Module['locateFile'](wasmTextFile);
            }
            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = Module['locateFile'](wasmBinaryFile);
            }
            if (!isDataURI(asmjsCodeFile)) {
                asmjsCodeFile = Module['locateFile'](asmjsCodeFile);
            }
        }
        var wasmPageSize = 64 * 1024;
        var info = {
            global: null,
            env: null,
            asm2wasm: {
                'f64-rem': function(x, y) {
                    return x % y;
                },
                debugger: function() {
                    debugger;
                },
            },
            parent: Module,
        };
        var exports = null;
        function mergeMemory(newBuffer) {
            var oldBuffer = Module['buffer'];
            if (newBuffer.byteLength < oldBuffer.byteLength) {
                Module['printErr'](
                    'the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here',
                );
            }
            var oldView = new Int8Array(oldBuffer);
            var newView = new Int8Array(newBuffer);
            newView.set(oldView);
            updateGlobalBuffer(newBuffer);
            updateGlobalBufferViews();
        }
        function fixImports(imports) {
            return imports;
        }
        function getBinary() {
            try {
                if (Module['wasmBinary']) {
                    return new Uint8Array(Module['wasmBinary']);
                }
                if (Module['readBinary']) {
                    return Module['readBinary'](wasmBinaryFile);
                } else {
                    throw "on the web, we need the wasm binary to be preloaded and set on Module['wasmBinary']. emcc.py will do that for you when generating HTML (but not JS)";
                }
            } catch (err) {
                abort(err);
            }
        }
        function getBinaryPromise() {
            if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
                return fetch(wasmBinaryFile, { credentials: 'same-origin' })
                    .then(function(response) {
                        if (!response['ok']) {
                            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
                        }
                        return response['arrayBuffer']();
                    })
                    .catch(function() {
                        return getBinary();
                    });
            }
            return new Promise(function(resolve, reject) {
                resolve(getBinary());
            });
        }
        function doNativeWasm(global, env, providedBuffer) {
            if (typeof WebAssembly !== 'object') {
                Module['printErr']('no native wasm support detected');
                return false;
            }
            if (!(Module['wasmMemory'] instanceof WebAssembly.Memory)) {
                Module['printErr']('no native wasm Memory in use');
                return false;
            }
            env['memory'] = Module['wasmMemory'];
            info['global'] = { NaN: NaN, Infinity: Infinity };
            info['global.Math'] = Math;
            info['env'] = env;
            function receiveInstance(instance, module) {
                exports = instance.exports;
                if (exports.memory) mergeMemory(exports.memory);
                Module['asm'] = exports;
                Module['usingWasm'] = true;
                removeRunDependency('wasm-instantiate');
            }
            addRunDependency('wasm-instantiate');
            if (Module['instantiateWasm']) {
                try {
                    return Module['instantiateWasm'](info, receiveInstance);
                } catch (e) {
                    Module['printErr']('Module.instantiateWasm callback failed with error: ' + e);
                    return false;
                }
            }
            function receiveInstantiatedSource(output) {
                receiveInstance(output['instance'], output['module']);
            }
            function instantiateArrayBuffer(receiver) {
                getBinaryPromise()
                    .then(function(binary) {
                        return WebAssembly.instantiate(binary, info);
                    })
                    .then(receiver)
                    .catch(function(reason) {
                        Module['printErr']('failed to asynchronously prepare wasm: ' + reason);
                        abort(reason);
                    });
            }
            if (
                !Module['wasmBinary'] &&
                typeof WebAssembly.instantiateStreaming === 'function' &&
                !isDataURI(wasmBinaryFile) &&
                typeof fetch === 'function'
            ) {
                WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
                    .then(receiveInstantiatedSource)
                    .catch(function(reason) {
                        Module['printErr']('wasm streaming compile failed: ' + reason);
                        Module['printErr']('falling back to ArrayBuffer instantiation');
                        instantiateArrayBuffer(receiveInstantiatedSource);
                    });
            } else {
                instantiateArrayBuffer(receiveInstantiatedSource);
            }
            return {};
        }
        Module['asmPreload'] = Module['asm'];
        var asmjsReallocBuffer = Module['reallocBuffer'];
        var wasmReallocBuffer = function(size) {
            var PAGE_MULTIPLE = Module['usingWasm'] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
            size = alignUp(size, PAGE_MULTIPLE);
            var old = Module['buffer'];
            var oldSize = old.byteLength;
            if (Module['usingWasm']) {
                try {
                    var result = Module['wasmMemory'].grow((size - oldSize) / wasmPageSize);
                    if (result !== (-1 | 0)) {
                        return (Module['buffer'] = Module['wasmMemory'].buffer);
                    } else {
                        return null;
                    }
                } catch (e) {
                    return null;
                }
            }
        };
        Module['reallocBuffer'] = function(size) {
            if (finalMethod === 'asmjs') {
                return asmjsReallocBuffer(size);
            } else {
                return wasmReallocBuffer(size);
            }
        };
        var finalMethod = '';
        Module['asm'] = function(global, env, providedBuffer) {
            env = fixImports(env);
            if (!env['table']) {
                var TABLE_SIZE = Module['wasmTableSize'];
                if (TABLE_SIZE === undefined) TABLE_SIZE = 1024;
                var MAX_TABLE_SIZE = Module['wasmMaxTableSize'];
                if (typeof WebAssembly === 'object' && typeof WebAssembly.Table === 'function') {
                    if (MAX_TABLE_SIZE !== undefined) {
                        env['table'] = new WebAssembly.Table({
                            initial: TABLE_SIZE,
                            maximum: MAX_TABLE_SIZE,
                            element: 'anyfunc',
                        });
                    } else {
                        env['table'] = new WebAssembly.Table({ initial: TABLE_SIZE, element: 'anyfunc' });
                    }
                } else {
                    env['table'] = new Array(TABLE_SIZE);
                }
                Module['wasmTable'] = env['table'];
            }
            if (!env['memoryBase']) {
                env['memoryBase'] = Module['STATIC_BASE'];
            }
            if (!env['tableBase']) {
                env['tableBase'] = 0;
            }
            var exports;
            exports = doNativeWasm(global, env, providedBuffer);
            if (!exports)
                abort(
                    'no binaryen method succeeded. consider enabling more options, like interpreting, if you want that: https://github.com/kripken/emscripten/wiki/WebAssembly#binaryen-methods',
                );
            return exports;
        };
    }
    integrateWasmJS();
    var ASM_CONSTS = [
        function($0, $1) {
            Module.cryptoGetRandomValues($0, $1);
        },
    ];
    function _emscripten_asm_const_iii(code, a0, a1) {
        return ASM_CONSTS[code](a0, a1);
    }
    STATIC_BASE = GLOBAL_BASE;
    STATICTOP = STATIC_BASE + 13968;
    __ATINIT__.push(
        {
            func: function() {
                ___cxx_global_var_init();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_1();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_2();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_3();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_4();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_5();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_6();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_7();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_8();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_9();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_10();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_11();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_12();
            },
        },
        {
            func: function() {
                ___cxx_global_var_init_13();
            },
        },
    );
    var STATIC_BUMP = 13968;
    Module['STATIC_BASE'] = STATIC_BASE;
    Module['STATIC_BUMP'] = STATIC_BUMP;
    STATICTOP += 16;
    function _emscripten_memcpy_big(dest, src, num) {
        HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
        return dest;
    }
    function ___setErrNo(value) {
        if (Module['___errno_location']) HEAP32[Module['___errno_location']() >> 2] = value;
        return value;
    }
    DYNAMICTOP_PTR = staticAlloc(4);
    STACK_BASE = STACKTOP = alignMemory(STATICTOP);
    STACK_MAX = STACK_BASE + TOTAL_STACK;
    DYNAMIC_BASE = alignMemory(STACK_MAX);
    HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
    staticSealed = true;
    Module['wasmTableSize'] = 236;
    Module['wasmMaxTableSize'] = 236;
    Module.asmGlobalArg = {};
    Module.asmLibraryArg = {
        abort: abort,
        enlargeMemory: enlargeMemory,
        getTotalMemory: getTotalMemory,
        ___setErrNo: ___setErrNo,
        _emscripten_asm_const_iii: _emscripten_asm_const_iii,
        _emscripten_memcpy_big: _emscripten_memcpy_big,
        DYNAMICTOP_PTR: DYNAMICTOP_PTR,
        STACKTOP: STACKTOP,
    };
    var asm = Module['asm'](Module.asmGlobalArg, Module.asmLibraryArg, buffer);
    Module['asm'] = asm;
    var ___cxx_global_var_init = (Module['___cxx_global_var_init'] = function() {
        return Module['asm']['___cxx_global_var_init'].apply(null, arguments);
    });
    var ___cxx_global_var_init_1 = (Module['___cxx_global_var_init_1'] = function() {
        return Module['asm']['___cxx_global_var_init_1'].apply(null, arguments);
    });
    var ___cxx_global_var_init_10 = (Module['___cxx_global_var_init_10'] = function() {
        return Module['asm']['___cxx_global_var_init_10'].apply(null, arguments);
    });
    var ___cxx_global_var_init_11 = (Module['___cxx_global_var_init_11'] = function() {
        return Module['asm']['___cxx_global_var_init_11'].apply(null, arguments);
    });
    var ___cxx_global_var_init_12 = (Module['___cxx_global_var_init_12'] = function() {
        return Module['asm']['___cxx_global_var_init_12'].apply(null, arguments);
    });
    var ___cxx_global_var_init_13 = (Module['___cxx_global_var_init_13'] = function() {
        return Module['asm']['___cxx_global_var_init_13'].apply(null, arguments);
    });
    var ___cxx_global_var_init_2 = (Module['___cxx_global_var_init_2'] = function() {
        return Module['asm']['___cxx_global_var_init_2'].apply(null, arguments);
    });
    var ___cxx_global_var_init_3 = (Module['___cxx_global_var_init_3'] = function() {
        return Module['asm']['___cxx_global_var_init_3'].apply(null, arguments);
    });
    var ___cxx_global_var_init_4 = (Module['___cxx_global_var_init_4'] = function() {
        return Module['asm']['___cxx_global_var_init_4'].apply(null, arguments);
    });
    var ___cxx_global_var_init_5 = (Module['___cxx_global_var_init_5'] = function() {
        return Module['asm']['___cxx_global_var_init_5'].apply(null, arguments);
    });
    var ___cxx_global_var_init_6 = (Module['___cxx_global_var_init_6'] = function() {
        return Module['asm']['___cxx_global_var_init_6'].apply(null, arguments);
    });
    var ___cxx_global_var_init_7 = (Module['___cxx_global_var_init_7'] = function() {
        return Module['asm']['___cxx_global_var_init_7'].apply(null, arguments);
    });
    var ___cxx_global_var_init_8 = (Module['___cxx_global_var_init_8'] = function() {
        return Module['asm']['___cxx_global_var_init_8'].apply(null, arguments);
    });
    var ___cxx_global_var_init_9 = (Module['___cxx_global_var_init_9'] = function() {
        return Module['asm']['___cxx_global_var_init_9'].apply(null, arguments);
    });
    var ___errno_location = (Module['___errno_location'] = function() {
        return Module['asm']['___errno_location'].apply(null, arguments);
    });
    var _mclBnFp2_clear = (Module['_mclBnFp2_clear'] = function() {
        return Module['asm']['_mclBnFp2_clear'].apply(null, arguments);
    });
    var _mclBnFp2_deserialize = (Module['_mclBnFp2_deserialize'] = function() {
        return Module['asm']['_mclBnFp2_deserialize'].apply(null, arguments);
    });
    var _mclBnFp2_isEqual = (Module['_mclBnFp2_isEqual'] = function() {
        return Module['asm']['_mclBnFp2_isEqual'].apply(null, arguments);
    });
    var _mclBnFp2_mapToG2 = (Module['_mclBnFp2_mapToG2'] = function() {
        return Module['asm']['_mclBnFp2_mapToG2'].apply(null, arguments);
    });
    var _mclBnFp2_serialize = (Module['_mclBnFp2_serialize'] = function() {
        return Module['asm']['_mclBnFp2_serialize'].apply(null, arguments);
    });
    var _mclBnFp_clear = (Module['_mclBnFp_clear'] = function() {
        return Module['asm']['_mclBnFp_clear'].apply(null, arguments);
    });
    var _mclBnFp_deserialize = (Module['_mclBnFp_deserialize'] = function() {
        return Module['asm']['_mclBnFp_deserialize'].apply(null, arguments);
    });
    var _mclBnFp_isEqual = (Module['_mclBnFp_isEqual'] = function() {
        return Module['asm']['_mclBnFp_isEqual'].apply(null, arguments);
    });
    var _mclBnFp_mapToG1 = (Module['_mclBnFp_mapToG1'] = function() {
        return Module['asm']['_mclBnFp_mapToG1'].apply(null, arguments);
    });
    var _mclBnFp_serialize = (Module['_mclBnFp_serialize'] = function() {
        return Module['asm']['_mclBnFp_serialize'].apply(null, arguments);
    });
    var _mclBnFp_setHashOf = (Module['_mclBnFp_setHashOf'] = function() {
        return Module['asm']['_mclBnFp_setHashOf'].apply(null, arguments);
    });
    var _mclBnFp_setLittleEndian = (Module['_mclBnFp_setLittleEndian'] = function() {
        return Module['asm']['_mclBnFp_setLittleEndian'].apply(null, arguments);
    });
    var _mclBnFr_add = (Module['_mclBnFr_add'] = function() {
        return Module['asm']['_mclBnFr_add'].apply(null, arguments);
    });
    var _mclBnFr_clear = (Module['_mclBnFr_clear'] = function() {
        return Module['asm']['_mclBnFr_clear'].apply(null, arguments);
    });
    var _mclBnFr_deserialize = (Module['_mclBnFr_deserialize'] = function() {
        return Module['asm']['_mclBnFr_deserialize'].apply(null, arguments);
    });
    var _mclBnFr_div = (Module['_mclBnFr_div'] = function() {
        return Module['asm']['_mclBnFr_div'].apply(null, arguments);
    });
    var _mclBnFr_getStr = (Module['_mclBnFr_getStr'] = function() {
        return Module['asm']['_mclBnFr_getStr'].apply(null, arguments);
    });
    var _mclBnFr_inv = (Module['_mclBnFr_inv'] = function() {
        return Module['asm']['_mclBnFr_inv'].apply(null, arguments);
    });
    var _mclBnFr_isEqual = (Module['_mclBnFr_isEqual'] = function() {
        return Module['asm']['_mclBnFr_isEqual'].apply(null, arguments);
    });
    var _mclBnFr_isOne = (Module['_mclBnFr_isOne'] = function() {
        return Module['asm']['_mclBnFr_isOne'].apply(null, arguments);
    });
    var _mclBnFr_isValid = (Module['_mclBnFr_isValid'] = function() {
        return Module['asm']['_mclBnFr_isValid'].apply(null, arguments);
    });
    var _mclBnFr_isZero = (Module['_mclBnFr_isZero'] = function() {
        return Module['asm']['_mclBnFr_isZero'].apply(null, arguments);
    });
    var _mclBnFr_mul = (Module['_mclBnFr_mul'] = function() {
        return Module['asm']['_mclBnFr_mul'].apply(null, arguments);
    });
    var _mclBnFr_neg = (Module['_mclBnFr_neg'] = function() {
        return Module['asm']['_mclBnFr_neg'].apply(null, arguments);
    });
    var _mclBnFr_serialize = (Module['_mclBnFr_serialize'] = function() {
        return Module['asm']['_mclBnFr_serialize'].apply(null, arguments);
    });
    var _mclBnFr_setByCSPRNG = (Module['_mclBnFr_setByCSPRNG'] = function() {
        return Module['asm']['_mclBnFr_setByCSPRNG'].apply(null, arguments);
    });
    var _mclBnFr_setHashOf = (Module['_mclBnFr_setHashOf'] = function() {
        return Module['asm']['_mclBnFr_setHashOf'].apply(null, arguments);
    });
    var _mclBnFr_setInt = (Module['_mclBnFr_setInt'] = function() {
        return Module['asm']['_mclBnFr_setInt'].apply(null, arguments);
    });
    var _mclBnFr_setInt32 = (Module['_mclBnFr_setInt32'] = function() {
        return Module['asm']['_mclBnFr_setInt32'].apply(null, arguments);
    });
    var _mclBnFr_setLittleEndian = (Module['_mclBnFr_setLittleEndian'] = function() {
        return Module['asm']['_mclBnFr_setLittleEndian'].apply(null, arguments);
    });
    var _mclBnFr_setStr = (Module['_mclBnFr_setStr'] = function() {
        return Module['asm']['_mclBnFr_setStr'].apply(null, arguments);
    });
    var _mclBnFr_sqr = (Module['_mclBnFr_sqr'] = function() {
        return Module['asm']['_mclBnFr_sqr'].apply(null, arguments);
    });
    var _mclBnFr_sub = (Module['_mclBnFr_sub'] = function() {
        return Module['asm']['_mclBnFr_sub'].apply(null, arguments);
    });
    var _mclBnFree = (Module['_mclBnFree'] = function() {
        return Module['asm']['_mclBnFree'].apply(null, arguments);
    });
    var _mclBnG1_add = (Module['_mclBnG1_add'] = function() {
        return Module['asm']['_mclBnG1_add'].apply(null, arguments);
    });
    var _mclBnG1_clear = (Module['_mclBnG1_clear'] = function() {
        return Module['asm']['_mclBnG1_clear'].apply(null, arguments);
    });
    var _mclBnG1_dbl = (Module['_mclBnG1_dbl'] = function() {
        return Module['asm']['_mclBnG1_dbl'].apply(null, arguments);
    });
    var _mclBnG1_deserialize = (Module['_mclBnG1_deserialize'] = function() {
        return Module['asm']['_mclBnG1_deserialize'].apply(null, arguments);
    });
    var _mclBnG1_getBasePoint = (Module['_mclBnG1_getBasePoint'] = function() {
        return Module['asm']['_mclBnG1_getBasePoint'].apply(null, arguments);
    });
    var _mclBnG1_getStr = (Module['_mclBnG1_getStr'] = function() {
        return Module['asm']['_mclBnG1_getStr'].apply(null, arguments);
    });
    var _mclBnG1_hashAndMapTo = (Module['_mclBnG1_hashAndMapTo'] = function() {
        return Module['asm']['_mclBnG1_hashAndMapTo'].apply(null, arguments);
    });
    var _mclBnG1_isEqual = (Module['_mclBnG1_isEqual'] = function() {
        return Module['asm']['_mclBnG1_isEqual'].apply(null, arguments);
    });
    var _mclBnG1_isValid = (Module['_mclBnG1_isValid'] = function() {
        return Module['asm']['_mclBnG1_isValid'].apply(null, arguments);
    });
    var _mclBnG1_isValidOrder = (Module['_mclBnG1_isValidOrder'] = function() {
        return Module['asm']['_mclBnG1_isValidOrder'].apply(null, arguments);
    });
    var _mclBnG1_isZero = (Module['_mclBnG1_isZero'] = function() {
        return Module['asm']['_mclBnG1_isZero'].apply(null, arguments);
    });
    var _mclBnG1_mul = (Module['_mclBnG1_mul'] = function() {
        return Module['asm']['_mclBnG1_mul'].apply(null, arguments);
    });
    var _mclBnG1_mulCT = (Module['_mclBnG1_mulCT'] = function() {
        return Module['asm']['_mclBnG1_mulCT'].apply(null, arguments);
    });
    var _mclBnG1_neg = (Module['_mclBnG1_neg'] = function() {
        return Module['asm']['_mclBnG1_neg'].apply(null, arguments);
    });
    var _mclBnG1_normalize = (Module['_mclBnG1_normalize'] = function() {
        return Module['asm']['_mclBnG1_normalize'].apply(null, arguments);
    });
    var _mclBnG1_serialize = (Module['_mclBnG1_serialize'] = function() {
        return Module['asm']['_mclBnG1_serialize'].apply(null, arguments);
    });
    var _mclBnG1_setStr = (Module['_mclBnG1_setStr'] = function() {
        return Module['asm']['_mclBnG1_setStr'].apply(null, arguments);
    });
    var _mclBnG1_sub = (Module['_mclBnG1_sub'] = function() {
        return Module['asm']['_mclBnG1_sub'].apply(null, arguments);
    });
    var _mclBnG2_add = (Module['_mclBnG2_add'] = function() {
        return Module['asm']['_mclBnG2_add'].apply(null, arguments);
    });
    var _mclBnG2_clear = (Module['_mclBnG2_clear'] = function() {
        return Module['asm']['_mclBnG2_clear'].apply(null, arguments);
    });
    var _mclBnG2_dbl = (Module['_mclBnG2_dbl'] = function() {
        return Module['asm']['_mclBnG2_dbl'].apply(null, arguments);
    });
    var _mclBnG2_deserialize = (Module['_mclBnG2_deserialize'] = function() {
        return Module['asm']['_mclBnG2_deserialize'].apply(null, arguments);
    });
    var _mclBnG2_getStr = (Module['_mclBnG2_getStr'] = function() {
        return Module['asm']['_mclBnG2_getStr'].apply(null, arguments);
    });
    var _mclBnG2_hashAndMapTo = (Module['_mclBnG2_hashAndMapTo'] = function() {
        return Module['asm']['_mclBnG2_hashAndMapTo'].apply(null, arguments);
    });
    var _mclBnG2_isEqual = (Module['_mclBnG2_isEqual'] = function() {
        return Module['asm']['_mclBnG2_isEqual'].apply(null, arguments);
    });
    var _mclBnG2_isValid = (Module['_mclBnG2_isValid'] = function() {
        return Module['asm']['_mclBnG2_isValid'].apply(null, arguments);
    });
    var _mclBnG2_isValidOrder = (Module['_mclBnG2_isValidOrder'] = function() {
        return Module['asm']['_mclBnG2_isValidOrder'].apply(null, arguments);
    });
    var _mclBnG2_isZero = (Module['_mclBnG2_isZero'] = function() {
        return Module['asm']['_mclBnG2_isZero'].apply(null, arguments);
    });
    var _mclBnG2_mul = (Module['_mclBnG2_mul'] = function() {
        return Module['asm']['_mclBnG2_mul'].apply(null, arguments);
    });
    var _mclBnG2_mulCT = (Module['_mclBnG2_mulCT'] = function() {
        return Module['asm']['_mclBnG2_mulCT'].apply(null, arguments);
    });
    var _mclBnG2_neg = (Module['_mclBnG2_neg'] = function() {
        return Module['asm']['_mclBnG2_neg'].apply(null, arguments);
    });
    var _mclBnG2_normalize = (Module['_mclBnG2_normalize'] = function() {
        return Module['asm']['_mclBnG2_normalize'].apply(null, arguments);
    });
    var _mclBnG2_serialize = (Module['_mclBnG2_serialize'] = function() {
        return Module['asm']['_mclBnG2_serialize'].apply(null, arguments);
    });
    var _mclBnG2_setStr = (Module['_mclBnG2_setStr'] = function() {
        return Module['asm']['_mclBnG2_setStr'].apply(null, arguments);
    });
    var _mclBnG2_sub = (Module['_mclBnG2_sub'] = function() {
        return Module['asm']['_mclBnG2_sub'].apply(null, arguments);
    });
    var _mclBnGT_add = (Module['_mclBnGT_add'] = function() {
        return Module['asm']['_mclBnGT_add'].apply(null, arguments);
    });
    var _mclBnGT_clear = (Module['_mclBnGT_clear'] = function() {
        return Module['asm']['_mclBnGT_clear'].apply(null, arguments);
    });
    var _mclBnGT_deserialize = (Module['_mclBnGT_deserialize'] = function() {
        return Module['asm']['_mclBnGT_deserialize'].apply(null, arguments);
    });
    var _mclBnGT_div = (Module['_mclBnGT_div'] = function() {
        return Module['asm']['_mclBnGT_div'].apply(null, arguments);
    });
    var _mclBnGT_getStr = (Module['_mclBnGT_getStr'] = function() {
        return Module['asm']['_mclBnGT_getStr'].apply(null, arguments);
    });
    var _mclBnGT_inv = (Module['_mclBnGT_inv'] = function() {
        return Module['asm']['_mclBnGT_inv'].apply(null, arguments);
    });
    var _mclBnGT_isEqual = (Module['_mclBnGT_isEqual'] = function() {
        return Module['asm']['_mclBnGT_isEqual'].apply(null, arguments);
    });
    var _mclBnGT_isOne = (Module['_mclBnGT_isOne'] = function() {
        return Module['asm']['_mclBnGT_isOne'].apply(null, arguments);
    });
    var _mclBnGT_isZero = (Module['_mclBnGT_isZero'] = function() {
        return Module['asm']['_mclBnGT_isZero'].apply(null, arguments);
    });
    var _mclBnGT_mul = (Module['_mclBnGT_mul'] = function() {
        return Module['asm']['_mclBnGT_mul'].apply(null, arguments);
    });
    var _mclBnGT_neg = (Module['_mclBnGT_neg'] = function() {
        return Module['asm']['_mclBnGT_neg'].apply(null, arguments);
    });
    var _mclBnGT_pow = (Module['_mclBnGT_pow'] = function() {
        return Module['asm']['_mclBnGT_pow'].apply(null, arguments);
    });
    var _mclBnGT_powGeneric = (Module['_mclBnGT_powGeneric'] = function() {
        return Module['asm']['_mclBnGT_powGeneric'].apply(null, arguments);
    });
    var _mclBnGT_serialize = (Module['_mclBnGT_serialize'] = function() {
        return Module['asm']['_mclBnGT_serialize'].apply(null, arguments);
    });
    var _mclBnGT_setInt = (Module['_mclBnGT_setInt'] = function() {
        return Module['asm']['_mclBnGT_setInt'].apply(null, arguments);
    });
    var _mclBnGT_setInt32 = (Module['_mclBnGT_setInt32'] = function() {
        return Module['asm']['_mclBnGT_setInt32'].apply(null, arguments);
    });
    var _mclBnGT_setStr = (Module['_mclBnGT_setStr'] = function() {
        return Module['asm']['_mclBnGT_setStr'].apply(null, arguments);
    });
    var _mclBnGT_sqr = (Module['_mclBnGT_sqr'] = function() {
        return Module['asm']['_mclBnGT_sqr'].apply(null, arguments);
    });
    var _mclBnGT_sub = (Module['_mclBnGT_sub'] = function() {
        return Module['asm']['_mclBnGT_sub'].apply(null, arguments);
    });
    var _mclBnMalloc = (Module['_mclBnMalloc'] = function() {
        return Module['asm']['_mclBnMalloc'].apply(null, arguments);
    });
    var _mclBn_FrEvaluatePolynomial = (Module['_mclBn_FrEvaluatePolynomial'] = function() {
        return Module['asm']['_mclBn_FrEvaluatePolynomial'].apply(null, arguments);
    });
    var _mclBn_FrLagrangeInterpolation = (Module['_mclBn_FrLagrangeInterpolation'] = function() {
        return Module['asm']['_mclBn_FrLagrangeInterpolation'].apply(null, arguments);
    });
    var _mclBn_G1EvaluatePolynomial = (Module['_mclBn_G1EvaluatePolynomial'] = function() {
        return Module['asm']['_mclBn_G1EvaluatePolynomial'].apply(null, arguments);
    });
    var _mclBn_G1LagrangeInterpolation = (Module['_mclBn_G1LagrangeInterpolation'] = function() {
        return Module['asm']['_mclBn_G1LagrangeInterpolation'].apply(null, arguments);
    });
    var _mclBn_G2EvaluatePolynomial = (Module['_mclBn_G2EvaluatePolynomial'] = function() {
        return Module['asm']['_mclBn_G2EvaluatePolynomial'].apply(null, arguments);
    });
    var _mclBn_G2LagrangeInterpolation = (Module['_mclBn_G2LagrangeInterpolation'] = function() {
        return Module['asm']['_mclBn_G2LagrangeInterpolation'].apply(null, arguments);
    });
    var _mclBn_finalExp = (Module['_mclBn_finalExp'] = function() {
        return Module['asm']['_mclBn_finalExp'].apply(null, arguments);
    });
    var _mclBn_getCurveOrder = (Module['_mclBn_getCurveOrder'] = function() {
        return Module['asm']['_mclBn_getCurveOrder'].apply(null, arguments);
    });
    var _mclBn_getFieldOrder = (Module['_mclBn_getFieldOrder'] = function() {
        return Module['asm']['_mclBn_getFieldOrder'].apply(null, arguments);
    });
    var _mclBn_getFpByteSize = (Module['_mclBn_getFpByteSize'] = function() {
        return Module['asm']['_mclBn_getFpByteSize'].apply(null, arguments);
    });
    var _mclBn_getFrByteSize = (Module['_mclBn_getFrByteSize'] = function() {
        return Module['asm']['_mclBn_getFrByteSize'].apply(null, arguments);
    });
    var _mclBn_getG1ByteSize = (Module['_mclBn_getG1ByteSize'] = function() {
        return Module['asm']['_mclBn_getG1ByteSize'].apply(null, arguments);
    });
    var _mclBn_getOpUnitSize = (Module['_mclBn_getOpUnitSize'] = function() {
        return Module['asm']['_mclBn_getOpUnitSize'].apply(null, arguments);
    });
    var _mclBn_getUint64NumToPrecompute = (Module['_mclBn_getUint64NumToPrecompute'] = function() {
        return Module['asm']['_mclBn_getUint64NumToPrecompute'].apply(null, arguments);
    });
    var _mclBn_init = (Module['_mclBn_init'] = function() {
        return Module['asm']['_mclBn_init'].apply(null, arguments);
    });
    var _mclBn_millerLoop = (Module['_mclBn_millerLoop'] = function() {
        return Module['asm']['_mclBn_millerLoop'].apply(null, arguments);
    });
    var _mclBn_pairing = (Module['_mclBn_pairing'] = function() {
        return Module['asm']['_mclBn_pairing'].apply(null, arguments);
    });
    var _mclBn_precomputeG2 = (Module['_mclBn_precomputeG2'] = function() {
        return Module['asm']['_mclBn_precomputeG2'].apply(null, arguments);
    });
    var _mclBn_precomputedMillerLoop = (Module['_mclBn_precomputedMillerLoop'] = function() {
        return Module['asm']['_mclBn_precomputedMillerLoop'].apply(null, arguments);
    });
    var _mclBn_precomputedMillerLoop2 = (Module['_mclBn_precomputedMillerLoop2'] = function() {
        return Module['asm']['_mclBn_precomputedMillerLoop2'].apply(null, arguments);
    });
    var _mclBn_precomputedMillerLoop2mixed = (Module['_mclBn_precomputedMillerLoop2mixed'] = function() {
        return Module['asm']['_mclBn_precomputedMillerLoop2mixed'].apply(null, arguments);
    });
    var _mclBn_setRandFunc = (Module['_mclBn_setRandFunc'] = function() {
        return Module['asm']['_mclBn_setRandFunc'].apply(null, arguments);
    });
    var _mclBn_verifyOrderG1 = (Module['_mclBn_verifyOrderG1'] = function() {
        return Module['asm']['_mclBn_verifyOrderG1'].apply(null, arguments);
    });
    var _mclBn_verifyOrderG2 = (Module['_mclBn_verifyOrderG2'] = function() {
        return Module['asm']['_mclBn_verifyOrderG2'].apply(null, arguments);
    });
    var dynCall_vi = (Module['dynCall_vi'] = function() {
        return Module['asm']['dynCall_vi'].apply(null, arguments);
    });
    Module['asm'] = asm;
    Module['then'] = function(func) {
        if (Module['calledRun']) {
            func(Module);
        } else {
            var old = Module['onRuntimeInitialized'];
            Module['onRuntimeInitialized'] = function() {
                if (old) old();
                func(Module);
            };
        }
        return Module;
    };
    function ExitStatus(status) {
        this.name = 'ExitStatus';
        this.message = 'Program terminated with exit(' + status + ')';
        this.status = status;
    }
    ExitStatus.prototype = new Error();
    ExitStatus.prototype.constructor = ExitStatus;
    var initialStackTop;
    dependenciesFulfilled = function runCaller() {
        if (!Module['calledRun']) run();
        if (!Module['calledRun']) dependenciesFulfilled = runCaller;
    };
    function run(args) {
        args = args || Module['arguments'];
        if (runDependencies > 0) {
            return;
        }
        preRun();
        if (runDependencies > 0) return;
        if (Module['calledRun']) return;
        function doRun() {
            if (Module['calledRun']) return;
            Module['calledRun'] = true;
            if (ABORT) return;
            ensureInitRuntime();
            preMain();
            if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
            postRun();
        }
        if (Module['setStatus']) {
            Module['setStatus']('Running...');
            setTimeout(function() {
                setTimeout(function() {
                    Module['setStatus']('');
                }, 1);
                doRun();
            }, 1);
        } else {
            doRun();
        }
    }
    Module['run'] = run;
    function exit(status, implicit) {
        if (implicit && Module['noExitRuntime'] && status === 0) {
            return;
        }
        if (Module['noExitRuntime']) {
        } else {
            ABORT = true;
            EXITSTATUS = status;
            STACKTOP = initialStackTop;
            exitRuntime();
            if (Module['onExit']) Module['onExit'](status);
        }
        if (ENVIRONMENT_IS_NODE) {
            process['exit'](status);
        }
        Module['quit'](status, new ExitStatus(status));
    }
    Module['exit'] = exit;
    function abort(what) {
        if (Module['onAbort']) {
            Module['onAbort'](what);
        }
        if (what !== undefined) {
            Module.print(what);
            Module.printErr(what);
            what = JSON.stringify(what);
        } else {
            what = '';
        }
        ABORT = true;
        EXITSTATUS = 1;
        throw 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';
    }
    Module['abort'] = abort;
    if (Module['preInit']) {
        if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
        while (Module['preInit'].length > 0) {
            Module['preInit'].pop()();
        }
    }
    Module['noExitRuntime'] = true;
    run();

    return Module;
};
if (typeof exports === 'object' && typeof module === 'object') module.exports = Module;
else if (typeof define === 'function' && define['amd'])
    define([], function() {
        return Module;
    });
else if (typeof exports === 'object') exports['Module'] = Module;
