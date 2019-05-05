require('dotenv').config();
const url = require('url');
const util = require('util');
const http = require('http');
const AWS = require('aws-sdk');
const serve_static = require('serve-static');
const argv = require('minimist')(process.argv);
const serve_static_files = serve_static('build');

argv.app_name = argv.app_name || process.env.APP_NAME || 'S3 Speedometer';
argv.endpoint = argv.endpoint || process.env.S3_ENDPOINT;
argv.bucket = argv.bucket || process.env.S3_BUCKET;
argv.key = argv.key || process.env.S3_KEY;
argv.concur = argv.concur || process.env.S3_CONCUR || 8;
console.log(argv);

const s3 = new AWS.S3({
    endpoint: argv.endpoint,
    accessKeyId: argv.access_key,
    secretAccessKey: argv.secret_key,
    s3ForcePathStyle: true,
    sslEnabled: false,
    computeChecksums: false,
    signatureVersion: 's3',
});

class Speed {

    constructor() {
        this.total_time = Date.now();
        this.total_bytes = 0;
        this.total_count = 0;
        this.curr_time = this.start_time;
        this.curr_bytes = 0;
        this.curr_count = 0;
        this.history = [];
    }

    add_bytes(n) {
        this.total_bytes += n;
        this.curr_bytes += n;
    }

    add_count(n) {
        this.total_count += n;
        this.curr_count += n;
    }

    tick(now = Date.now()) {
        const curr_seconds = (now - this.curr_time) / 1000;
        const curr_mbps = this.curr_bytes / curr_seconds / 1024 / 1024;
        const curr_iops = this.curr_count / curr_seconds;
        const total_seconds = (now - this.total_time) / 1000;
        const total_mbps = this.total_bytes / total_seconds / 1024 / 1024;
        const total_iops = this.total_count / total_seconds;
        this.history.push({
            time: this.curr_time,
            seconds: curr_seconds,
            mbps: curr_mbps,
            iops: curr_iops,
            total_mbps,
            total_iops,
            total_bytes: this.total_bytes,
            total_count: this.total_count,
        });
        while (this.history.length > 10) this.history.shift();

        console.log(new Date(now).toISOString(), '[S3-Speedometer]',
            `${curr_mbps.toFixed(1)} MB/sec (avg ${total_mbps.toFixed(1)}) ;`,
            `${curr_iops.toFixed(1)} count (avg ${total_iops.toFixed(1)})`
        );

        this.curr_time = now;
        this.curr_bytes = 0;
        this.curr_count = 0;
    }
}

const s3_speed = new Speed();
setInterval(() => s3_speed.tick(), 1000);

async function worker() {
    while (true) {
        try {
            const stream = s3.getObject({
                Bucket: argv.bucket,
                Key: argv.key,
            }).createReadStream();
            await new Promise((resolve, reject) => stream
                .once('error', reject)
                .once('end', resolve)
                .on('data', buf => s3_speed.add_bytes(buf.length))
            );
            s3_speed.add_count(1);
        } catch (err) {
            console.error(err);
            await util.promisify(setTimeout)(3000);
        }
    }
}

function serve(req, res) {
    req.url = url.parse(req.url, true);
    if (req.url.path === '/api/fetch') {
        res.end(JSON.stringify({
            argv,
            history: s3_speed.history,
        }));
        return;
    }
    serve_static_files(req, res, err => {
        res.statusCode = 404;
        res.end(err ? err.message : 'NotFound');
    });
}

function main() {
    const server = http.createServer(serve);
    server.listen(8080, () => console.log(`Serving port 8080`));

    for (let i = 0; i < argv.concur; ++i) {
        setImmediate(worker);
    }
}

main();