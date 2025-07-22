module.exports = {
  apps: [
    {
      name: "audit-stream",
      script: "npm",
      args: "start",
      cwd: "/var/www/audit-stream",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Auto restart
      watch: false,
      ignore_watch: ["node_modules", "logs"],

      // Memory management
      max_memory_restart: "500M",

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],

  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-username/audit-stream.git",
      path: "/var/www/audit-stream",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
}
