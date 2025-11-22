"use strict";
/**
 * Scene Handlers Index
 * 导出所有场景处理器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToggleWithTemplate = exports.createProgressBarWithTemplate = exports.createPageViewWithTemplate = exports.createSliderWithTemplate = exports.createScrollViewWithTemplate = exports.createLayoutWithTemplate = exports.createSpriteWithTemplate = exports.createButtonWithTemplate = void 0;
var button_handler_1 = require("./button-handler");
Object.defineProperty(exports, "createButtonWithTemplate", { enumerable: true, get: function () { return button_handler_1.createButtonWithTemplate; } });
var sprite_handler_1 = require("./sprite-handler");
Object.defineProperty(exports, "createSpriteWithTemplate", { enumerable: true, get: function () { return sprite_handler_1.createSpriteWithTemplate; } });
var layout_handler_1 = require("./layout-handler");
Object.defineProperty(exports, "createLayoutWithTemplate", { enumerable: true, get: function () { return layout_handler_1.createLayoutWithTemplate; } });
var scrollview_handler_1 = require("./scrollview-handler");
Object.defineProperty(exports, "createScrollViewWithTemplate", { enumerable: true, get: function () { return scrollview_handler_1.createScrollViewWithTemplate; } });
var slider_handler_1 = require("./slider-handler");
Object.defineProperty(exports, "createSliderWithTemplate", { enumerable: true, get: function () { return slider_handler_1.createSliderWithTemplate; } });
var pageview_handler_1 = require("./pageview-handler");
Object.defineProperty(exports, "createPageViewWithTemplate", { enumerable: true, get: function () { return pageview_handler_1.createPageViewWithTemplate; } });
var progressbar_handler_1 = require("./progressbar-handler");
Object.defineProperty(exports, "createProgressBarWithTemplate", { enumerable: true, get: function () { return progressbar_handler_1.createProgressBarWithTemplate; } });
var toggle_handler_1 = require("./toggle-handler");
Object.defineProperty(exports, "createToggleWithTemplate", { enumerable: true, get: function () { return toggle_handler_1.createToggleWithTemplate; } });
// 未来可以添加更多处理器
// export { createLabelNode } from './label-handler';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2NlbmUtaGFuZGxlcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsbURBQTREO0FBQW5ELDBIQUFBLHdCQUF3QixPQUFBO0FBQ2pDLG1EQUE0RDtBQUFuRCwwSEFBQSx3QkFBd0IsT0FBQTtBQUNqQyxtREFBNEQ7QUFBbkQsMEhBQUEsd0JBQXdCLE9BQUE7QUFDakMsMkRBQW9FO0FBQTNELGtJQUFBLDRCQUE0QixPQUFBO0FBQ3JDLG1EQUE0RDtBQUFuRCwwSEFBQSx3QkFBd0IsT0FBQTtBQUNqQyx1REFBZ0U7QUFBdkQsOEhBQUEsMEJBQTBCLE9BQUE7QUFDbkMsNkRBQXNFO0FBQTdELG9JQUFBLDZCQUE2QixPQUFBO0FBQ3RDLG1EQUE0RDtBQUFuRCwwSEFBQSx3QkFBd0IsT0FBQTtBQUVqQyxjQUFjO0FBQ2QscURBQXFEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTY2VuZSBIYW5kbGVycyBJbmRleFxuICog5a+85Ye65omA5pyJ5Zy65pmv5aSE55CG5ZmoXG4gKi9cblxuZXhwb3J0IHsgY3JlYXRlQnV0dG9uV2l0aFRlbXBsYXRlIH0gZnJvbSAnLi9idXR0b24taGFuZGxlcic7XG5leHBvcnQgeyBjcmVhdGVTcHJpdGVXaXRoVGVtcGxhdGUgfSBmcm9tICcuL3Nwcml0ZS1oYW5kbGVyJztcbmV4cG9ydCB7IGNyZWF0ZUxheW91dFdpdGhUZW1wbGF0ZSB9IGZyb20gJy4vbGF5b3V0LWhhbmRsZXInO1xuZXhwb3J0IHsgY3JlYXRlU2Nyb2xsVmlld1dpdGhUZW1wbGF0ZSB9IGZyb20gJy4vc2Nyb2xsdmlldy1oYW5kbGVyJztcbmV4cG9ydCB7IGNyZWF0ZVNsaWRlcldpdGhUZW1wbGF0ZSB9IGZyb20gJy4vc2xpZGVyLWhhbmRsZXInO1xuZXhwb3J0IHsgY3JlYXRlUGFnZVZpZXdXaXRoVGVtcGxhdGUgfSBmcm9tICcuL3BhZ2V2aWV3LWhhbmRsZXInO1xuZXhwb3J0IHsgY3JlYXRlUHJvZ3Jlc3NCYXJXaXRoVGVtcGxhdGUgfSBmcm9tICcuL3Byb2dyZXNzYmFyLWhhbmRsZXInO1xuZXhwb3J0IHsgY3JlYXRlVG9nZ2xlV2l0aFRlbXBsYXRlIH0gZnJvbSAnLi90b2dnbGUtaGFuZGxlcic7XG5cbi8vIOacquadpeWPr+S7pea3u+WKoOabtOWkmuWkhOeQhuWZqFxuLy8gZXhwb3J0IHsgY3JlYXRlTGFiZWxOb2RlIH0gZnJvbSAnLi9sYWJlbC1oYW5kbGVyJztcbiJdfQ==