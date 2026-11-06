"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardFooter = CardFooter;
exports.CardTitle = CardTitle;
exports.CardAction = CardAction;
exports.CardDescription = CardDescription;
exports.CardContent = CardContent;
const React = __importStar(require("react"));
const utils_1 = require("@/lib/utils");
function Card({ className, size = "default", ...props }) {
    return (<div data-slot="card" data-size={size} className={(0, utils_1.cn)("group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-none bg-card py-(--card-spacing) text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none", className)} {...props}/>);
}
function CardHeader({ className, ...props }) {
    return (<div data-slot="card-header" className={(0, utils_1.cn)("group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-none px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)", className)} {...props}/>);
}
function CardTitle({ className, ...props }) {
    return (<div data-slot="card-title" className={(0, utils_1.cn)("font-heading text-sm font-medium group-data-[size=sm]/card:text-sm", className)} {...props}/>);
}
function CardDescription({ className, ...props }) {
    return (<div data-slot="card-description" className={(0, utils_1.cn)("text-xs/relaxed text-muted-foreground", className)} {...props}/>);
}
function CardAction({ className, ...props }) {
    return (<div data-slot="card-action" className={(0, utils_1.cn)("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props}/>);
}
function CardContent({ className, ...props }) {
    return (<div data-slot="card-content" className={(0, utils_1.cn)("px-(--card-spacing)", className)} {...props}/>);
}
function CardFooter({ className, ...props }) {
    return (<div data-slot="card-footer" className={(0, utils_1.cn)("flex items-center rounded-none border-t p-(--card-spacing)", className)} {...props}/>);
}
