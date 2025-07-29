/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "__barrel_optimize__?names=ConfigProvider!=!./node_modules/antd/es/index.js":
/*!**********************************************************************************!*\
  !*** __barrel_optimize__?names=ConfigProvider!=!./node_modules/antd/es/index.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ConfigProvider: () => (/* reexport safe */ _config_provider__WEBPACK_IMPORTED_MODULE_0__[\"default\"])\n/* harmony export */ });\n/* harmony import */ var _config_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config-provider */ \"./node_modules/antd/es/config-provider/index.js\");\n/* __next_internal_client_entry_do_not_use__ ConfigProvider auto */ \n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX19iYXJyZWxfb3B0aW1pemVfXz9uYW1lcz1Db25maWdQcm92aWRlciE9IS4vbm9kZV9tb2R1bGVzL2FudGQvZXMvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7b0VBRTZEIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2lraS1rbm93bGVkZ2UtYmFzZS1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy9hbnRkL2VzL2luZGV4LmpzP2I5ZWIiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCI7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgQ29uZmlnUHJvdmlkZXIgfSBmcm9tIFwiLi9jb25maWctcHJvdmlkZXJcIiJdLCJuYW1lcyI6WyJkZWZhdWx0IiwiQ29uZmlnUHJvdmlkZXIiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///__barrel_optimize__?names=ConfigProvider!=!./node_modules/antd/es/index.js\n");

/***/ }),

/***/ "./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _barrel_optimize_names_ConfigProvider_antd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! __barrel_optimize__?names=ConfigProvider!=!antd */ \"__barrel_optimize__?names=ConfigProvider!=!./node_modules/antd/es/index.js\");\n/* harmony import */ var react_query__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-query */ \"react-query\");\n/* harmony import */ var react_query__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_query__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_query_devtools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-query/devtools */ \"react-query/devtools\");\n/* harmony import */ var react_query_devtools__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_query_devtools__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var antd_locale_zh_CN__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd/locale/zh_CN */ \"./node_modules/antd/locale/zh_CN.js\");\n/* harmony import */ var antd_locale_zh_CN__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(antd_locale_zh_CN__WEBPACK_IMPORTED_MODULE_7__);\n/* harmony import */ var dayjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! dayjs */ \"dayjs\");\n/* harmony import */ var dayjs__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(dayjs__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var dayjs_locale_zh_cn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! dayjs/locale/zh-cn */ \"dayjs/locale/zh-cn\");\n/* harmony import */ var dayjs_locale_zh_cn__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(dayjs_locale_zh_cn__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/styles/globals.css */ \"./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_5__);\n\n\n\n\n\n\n\n\n// 设置dayjs中文语言\ndayjs__WEBPACK_IMPORTED_MODULE_3___default().locale(\"zh-cn\");\n// 创建React Query客户端\nconst queryClient = new react_query__WEBPACK_IMPORTED_MODULE_1__.QueryClient({\n    defaultOptions: {\n        queries: {\n            refetchOnWindowFocus: false,\n            retry: 1,\n            staleTime: 5 * 60 * 1000\n        }\n    }\n});\n// Ant Design主题配置\nconst antdTheme = {\n    token: {\n        colorPrimary: \"#0ea5e9\",\n        colorSuccess: \"#10b981\",\n        colorWarning: \"#f59e0b\",\n        colorError: \"#ef4444\",\n        colorInfo: \"#3b82f6\",\n        borderRadius: 6,\n        fontSize: 14,\n        fontFamily: \"Inter, system-ui, -apple-system, sans-serif\"\n    },\n    components: {\n        Layout: {\n            headerBg: \"#ffffff\",\n            siderBg: \"#ffffff\",\n            bodyBg: \"#f8fafc\"\n        },\n        Menu: {\n            itemBg: \"transparent\",\n            itemSelectedBg: \"#e0f2fe\",\n            itemSelectedColor: \"#0ea5e9\",\n            itemHoverBg: \"#f0f9ff\"\n        },\n        Button: {\n            borderRadius: 6\n        },\n        Input: {\n            borderRadius: 6\n        },\n        Card: {\n            borderRadius: 8\n        }\n    }\n};\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_query__WEBPACK_IMPORTED_MODULE_1__.QueryClientProvider, {\n        client: queryClient,\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_ConfigProvider_antd__WEBPACK_IMPORTED_MODULE_6__.ConfigProvider, {\n                locale: (antd_locale_zh_CN__WEBPACK_IMPORTED_MODULE_7___default()),\n                theme: antdTheme,\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"F:\\\\next\\\\wiki-xmsumi\\\\frontend\\\\src\\\\pages\\\\_app.tsx\",\n                    lineNumber: 67,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"F:\\\\next\\\\wiki-xmsumi\\\\frontend\\\\src\\\\pages\\\\_app.tsx\",\n                lineNumber: 63,\n                columnNumber: 7\n            }, this),\n             true && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_query_devtools__WEBPACK_IMPORTED_MODULE_2__.ReactQueryDevtools, {\n                initialIsOpen: false\n            }, void 0, false, {\n                fileName: \"F:\\\\next\\\\wiki-xmsumi\\\\frontend\\\\src\\\\pages\\\\_app.tsx\",\n                lineNumber: 70,\n                columnNumber: 9\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"F:\\\\next\\\\wiki-xmsumi\\\\frontend\\\\src\\\\pages\\\\_app.tsx\",\n        lineNumber: 62,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDc0M7QUFDeUI7QUFDTDtBQUNyQjtBQUNYO0FBQ0U7QUFDRTtBQUU5QixjQUFjO0FBQ2RLLG1EQUFZLENBQUM7QUFFYixtQkFBbUI7QUFDbkIsTUFBTUUsY0FBYyxJQUFJTixvREFBV0EsQ0FBQztJQUNsQ08sZ0JBQWdCO1FBQ2RDLFNBQVM7WUFDUEMsc0JBQXNCO1lBQ3RCQyxPQUFPO1lBQ1BDLFdBQVcsSUFBSSxLQUFLO1FBQ3RCO0lBQ0Y7QUFDRjtBQUVBLGlCQUFpQjtBQUNqQixNQUFNQyxZQUFZO0lBQ2hCQyxPQUFPO1FBQ0xDLGNBQWM7UUFDZEMsY0FBYztRQUNkQyxjQUFjO1FBQ2RDLFlBQVk7UUFDWkMsV0FBVztRQUNYQyxjQUFjO1FBQ2RDLFVBQVU7UUFDVkMsWUFBWTtJQUNkO0lBQ0FDLFlBQVk7UUFDVkMsUUFBUTtZQUNOQyxVQUFVO1lBQ1ZDLFNBQVM7WUFDVEMsUUFBUTtRQUNWO1FBQ0FDLE1BQU07WUFDSkMsUUFBUTtZQUNSQyxnQkFBZ0I7WUFDaEJDLG1CQUFtQjtZQUNuQkMsYUFBYTtRQUNmO1FBQ0FDLFFBQVE7WUFDTmIsY0FBYztRQUNoQjtRQUNBYyxPQUFPO1lBQ0xkLGNBQWM7UUFDaEI7UUFDQWUsTUFBTTtZQUNKZixjQUFjO1FBQ2hCO0lBQ0Y7QUFDRjtBQUVlLFNBQVNnQixJQUFJLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFZO0lBQzVELHFCQUNFLDhEQUFDcEMsNERBQW1CQTtRQUFDcUMsUUFBUWhDOzswQkFDM0IsOERBQUNQLHNGQUFjQTtnQkFDYk0sUUFBUUYsMERBQUlBO2dCQUNab0MsT0FBTzNCOzBCQUVQLDRFQUFDd0I7b0JBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7WUFsRWhDLEtBb0VnQyxrQkFDeEIsOERBQUNuQyxvRUFBa0JBO2dCQUFDc0MsZUFBZTs7Ozs7Ozs7Ozs7O0FBSTNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2lraS1rbm93bGVkZ2UtYmFzZS1mcm9udGVuZC8uL3NyYy9wYWdlcy9fYXBwLnRzeD9mOWQ2Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tICduZXh0L2FwcCc7XHJcbmltcG9ydCB7IENvbmZpZ1Byb3ZpZGVyIH0gZnJvbSAnYW50ZCc7XHJcbmltcG9ydCB7IFF1ZXJ5Q2xpZW50LCBRdWVyeUNsaWVudFByb3ZpZGVyIH0gZnJvbSAncmVhY3QtcXVlcnknO1xyXG5pbXBvcnQgeyBSZWFjdFF1ZXJ5RGV2dG9vbHMgfSBmcm9tICdyZWFjdC1xdWVyeS9kZXZ0b29scyc7XHJcbmltcG9ydCB6aENOIGZyb20gJ2FudGQvbG9jYWxlL3poX0NOJztcclxuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcclxuaW1wb3J0ICdkYXlqcy9sb2NhbGUvemgtY24nO1xyXG5pbXBvcnQgJ0Avc3R5bGVzL2dsb2JhbHMuY3NzJztcclxuXHJcbi8vIOiuvue9rmRheWpz5Lit5paH6K+t6KiAXHJcbmRheWpzLmxvY2FsZSgnemgtY24nKTtcclxuXHJcbi8vIOWIm+W7ulJlYWN0IFF1ZXJ55a6i5oi356uvXHJcbmNvbnN0IHF1ZXJ5Q2xpZW50ID0gbmV3IFF1ZXJ5Q2xpZW50KHtcclxuICBkZWZhdWx0T3B0aW9uczoge1xyXG4gICAgcXVlcmllczoge1xyXG4gICAgICByZWZldGNoT25XaW5kb3dGb2N1czogZmFsc2UsXHJcbiAgICAgIHJldHJ5OiAxLFxyXG4gICAgICBzdGFsZVRpbWU6IDUgKiA2MCAqIDEwMDAsIC8vIDXliIbpkp9cclxuICAgIH0sXHJcbiAgfSxcclxufSk7XHJcblxyXG4vLyBBbnQgRGVzaWdu5Li76aKY6YWN572uXHJcbmNvbnN0IGFudGRUaGVtZSA9IHtcclxuICB0b2tlbjoge1xyXG4gICAgY29sb3JQcmltYXJ5OiAnIzBlYTVlOScsXHJcbiAgICBjb2xvclN1Y2Nlc3M6ICcjMTBiOTgxJyxcclxuICAgIGNvbG9yV2FybmluZzogJyNmNTllMGInLFxyXG4gICAgY29sb3JFcnJvcjogJyNlZjQ0NDQnLFxyXG4gICAgY29sb3JJbmZvOiAnIzNiODJmNicsXHJcbiAgICBib3JkZXJSYWRpdXM6IDYsXHJcbiAgICBmb250U2l6ZTogMTQsXHJcbiAgICBmb250RmFtaWx5OiAnSW50ZXIsIHN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZicsXHJcbiAgfSxcclxuICBjb21wb25lbnRzOiB7XHJcbiAgICBMYXlvdXQ6IHtcclxuICAgICAgaGVhZGVyQmc6ICcjZmZmZmZmJyxcclxuICAgICAgc2lkZXJCZzogJyNmZmZmZmYnLFxyXG4gICAgICBib2R5Qmc6ICcjZjhmYWZjJyxcclxuICAgIH0sXHJcbiAgICBNZW51OiB7XHJcbiAgICAgIGl0ZW1CZzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgaXRlbVNlbGVjdGVkQmc6ICcjZTBmMmZlJyxcclxuICAgICAgaXRlbVNlbGVjdGVkQ29sb3I6ICcjMGVhNWU5JyxcclxuICAgICAgaXRlbUhvdmVyQmc6ICcjZjBmOWZmJyxcclxuICAgIH0sXHJcbiAgICBCdXR0b246IHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiA2LFxyXG4gICAgfSxcclxuICAgIElucHV0OiB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogNixcclxuICAgIH0sXHJcbiAgICBDYXJkOiB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogOCxcclxuICAgIH0sXHJcbiAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XHJcbiAgcmV0dXJuIChcclxuICAgIDxRdWVyeUNsaWVudFByb3ZpZGVyIGNsaWVudD17cXVlcnlDbGllbnR9PlxyXG4gICAgICA8Q29uZmlnUHJvdmlkZXJcclxuICAgICAgICBsb2NhbGU9e3poQ059XHJcbiAgICAgICAgdGhlbWU9e2FudGRUaGVtZX1cclxuICAgICAgPlxyXG4gICAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cclxuICAgICAgPC9Db25maWdQcm92aWRlcj5cclxuICAgICAge3Byb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICYmIChcclxuICAgICAgICA8UmVhY3RRdWVyeURldnRvb2xzIGluaXRpYWxJc09wZW49e2ZhbHNlfSAvPlxyXG4gICAgICApfVxyXG4gICAgPC9RdWVyeUNsaWVudFByb3ZpZGVyPlxyXG4gICk7XHJcbn0iXSwibmFtZXMiOlsiQ29uZmlnUHJvdmlkZXIiLCJRdWVyeUNsaWVudCIsIlF1ZXJ5Q2xpZW50UHJvdmlkZXIiLCJSZWFjdFF1ZXJ5RGV2dG9vbHMiLCJ6aENOIiwiZGF5anMiLCJsb2NhbGUiLCJxdWVyeUNsaWVudCIsImRlZmF1bHRPcHRpb25zIiwicXVlcmllcyIsInJlZmV0Y2hPbldpbmRvd0ZvY3VzIiwicmV0cnkiLCJzdGFsZVRpbWUiLCJhbnRkVGhlbWUiLCJ0b2tlbiIsImNvbG9yUHJpbWFyeSIsImNvbG9yU3VjY2VzcyIsImNvbG9yV2FybmluZyIsImNvbG9yRXJyb3IiLCJjb2xvckluZm8iLCJib3JkZXJSYWRpdXMiLCJmb250U2l6ZSIsImZvbnRGYW1pbHkiLCJjb21wb25lbnRzIiwiTGF5b3V0IiwiaGVhZGVyQmciLCJzaWRlckJnIiwiYm9keUJnIiwiTWVudSIsIml0ZW1CZyIsIml0ZW1TZWxlY3RlZEJnIiwiaXRlbVNlbGVjdGVkQ29sb3IiLCJpdGVtSG92ZXJCZyIsIkJ1dHRvbiIsIklucHV0IiwiQ2FyZCIsIkFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsImNsaWVudCIsInRoZW1lIiwiaW5pdGlhbElzT3BlbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/pages/_app.tsx\n");

/***/ }),

/***/ "./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "@ant-design/colors":
/*!*************************************!*\
  !*** external "@ant-design/colors" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@ant-design/colors");

/***/ }),

/***/ "@ant-design/cssinjs":
/*!**************************************!*\
  !*** external "@ant-design/cssinjs" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@ant-design/cssinjs");

/***/ }),

/***/ "@ant-design/cssinjs-utils":
/*!********************************************!*\
  !*** external "@ant-design/cssinjs-utils" ***!
  \********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@ant-design/cssinjs-utils");

/***/ }),

/***/ "@ant-design/fast-color":
/*!*****************************************!*\
  !*** external "@ant-design/fast-color" ***!
  \*****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@ant-design/fast-color");

/***/ }),

/***/ "classnames":
/*!*****************************!*\
  !*** external "classnames" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("classnames");

/***/ }),

/***/ "dayjs":
/*!************************!*\
  !*** external "dayjs" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("dayjs");

/***/ }),

/***/ "dayjs/locale/zh-cn":
/*!*************************************!*\
  !*** external "dayjs/locale/zh-cn" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dayjs/locale/zh-cn");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react-query":
/*!******************************!*\
  !*** external "react-query" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-query");

/***/ }),

/***/ "react-query/devtools":
/*!***************************************!*\
  !*** external "react-query/devtools" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-query/devtools");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/@ant-design","vendor-chunks/antd","vendor-chunks/rc-util","vendor-chunks/rc-motion","vendor-chunks/@babel","vendor-chunks/rc-pagination","vendor-chunks/rc-picker"], () => (__webpack_exec__("./src/pages/_app.tsx")));
module.exports = __webpack_exports__;

})();