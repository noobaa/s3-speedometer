const url = require('url');
const http = require('http');
const AWS = require('aws-sdk');
const serve_static = require('serve-static');
const argv = require('minimist')(process.argv);

const speed_curr = {
    time: Date.now(),
    bytes: 0
};
const speed_log = [];

argv.endpoint = argv.endpoint || process.env.S3_ENDPOINT;
argv.bucket = argv.bucket || process.env.S3_BUCKET;
argv.key = argv.key || process.env.S3_KEY;

const s3 = new AWS.S3({
    endpoint: argv.endpoint,
    accessKeyId: argv.access,
    secretAccessKey: argv.secret,
    s3ForcePathStyle: true,
    sslEnabled: false,
});

async function wait_stream(stream) {
    return new Promise((resolve, reject) => stream
        .on('data', buf => update_speed(buf.length))
        .once('error', reject)
        .once('end', resolve)
    );
}

function update_speed(bytes) {
    speed_curr.bytes += bytes;
    const time = Date.now();
    if (time - speed_curr.time < 1000) return;
    speed_curr.bytes = speed_curr.bytes * 1000 / (time - speed_curr.time);
    console.log(new Date().toISOString(), 'speed', speed_curr.bytes / 1024 / 1024, 'MB/sec');
    speed_log.push({
        ...speed_curr
    });
    speed_curr.time = time;
    speed_curr.bytes = 0;
    while (speed_log.length > 20) speed_log.shift();
}

async function io() {
    while (true) {
        await wait_stream(s3.getObject({
            Bucket: argv.bucket,
            Key: argv.key,
        }).createReadStream());
    }
}

var serve_static_files = serve_static('build');

http.createServer((req, res) => {
        req.url = url.parse(req.url, true);
        if (req.url.path === '/api/fetch') {
            res.end(JSON.stringify(speed_log));
        } else {
            serve_static_files(req, res, err => {
                res.statusCode = 404;
                res.end(err ? err.message : 'NotFound');
            });
        }
    })
    .listen(8080, () => {
        console.log(`Serving port 8080`);
    });

io();