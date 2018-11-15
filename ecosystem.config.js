/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */

module.exports = {
    apps : [{
        name: "mservice",
        script: "./app/app.js",
        exec_mode: "cluster",
        instances: "max",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
};
