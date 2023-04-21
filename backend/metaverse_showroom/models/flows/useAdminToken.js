"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAdminToken = void 0;
const BackConfig_1 = require("../BackConfig");
/** admin 目录下的接口，校验 adminToken */
function useAdminToken(server) {
    server.flows.preApiCallFlow.push(call => {
        if (call.service.name.startsWith('admin/')) {
            if (call.req.adminToken !== BackConfig_1.BackConfig.adminToken) {
                call.error('adminToken error');
                return undefined;
            }
        }
        return call;
    });
}
exports.useAdminToken = useAdminToken;
