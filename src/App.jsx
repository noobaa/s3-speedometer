import React from 'react';
import './App.scss';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export default class App extends React.Component {

    state = {
        argv: {},
        history: [{ 
            total_bytes: 0, 
            total_count: 0,
            total_mbps: 0,
            total_iops: 0,
        }],
    };

    componentDidMount() {
        this.update();
    }

    async update() {
        try {
            const res = await fetch('/api/fetch');
            const state = await res.json();
            this.setState(state);
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.update(), 1000);
    }

    render() {
        console.warn(this.state);
        const { argv, history } = this.state;
        const {
            total_bytes, total_count, total_mbps, total_iops
        } = history[history.length - 1];
        return (
            <div className="App">
                <h1>{argv.app_name}</h1>
                <AreaChart
                    width={400}
                    height={320}
                    margin={{ top: 20, bottom: 40 }}
                    data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        name='Time'
                        dataKey='time'
                        type='number'
                        scale='time'
                        domain={['dataMin', 'dataMax']}
                        interval={0}
                        tickCount={history.length + 1}
                        tickFormatter={t => new Date(t).getSeconds()}
                        label={{
                            value: 'Time (seconds)',
                            offset: -15,
                            position: 'insideBottom'
                        }}
                    />
                    <YAxis
                        name='mbps'
                        dataKey='mbps'
                        type='number'
                        domain={[0, dataMax => {
                            if (dataMax < 10) return 10;
                            return Math.ceil(dataMax / 100) * 100;
                        }]}
                        interval={0}
                        tickCount={11}
                        label={{
                            value: 'MB / sec',
                            angle: -90,
                            offset: 15,
                            position: 'insideLeft'
                        }}
                    />
                    <Area
                        dataKey="mbps"
                        type="monotone"
                        stroke="#ff00ff"
                        fill="#ff00ff"
                    />
                    {false && <Legend />}
                    <Tooltip />
                </AreaChart>
                <table cellPadding="1">
                    <tr>
                        <th><h3>Total Data Transfer (MB)</h3></th>
                        <td><h3>{(total_bytes / 1024 / 1024).toFixed(1)}</h3></td>
                    </tr>
                    <tr>
                        <th><h3>Total Reads Completed</h3></th>
                        <td><h3>{total_count}</h3></td>
                    </tr>
                    <tr>
                        <th><h3>Average Throughput (MB/sec)</h3></th>
                        <td><h3>{total_mbps.toFixed(1)}</h3></td>
                    </tr>
                    <tr>
                        <th><h3>Average Latency (sec)</h3></th>
                        <td><h3>{(1 / total_iops).toFixed(1)}</h3></td>
                    </tr>
                </table>
            </div>
        );
    }
}
