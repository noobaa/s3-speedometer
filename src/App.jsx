import React from 'react';
import './App.scss';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export default class App extends React.Component {

    state = {
        speed_data: []
    };

    componentDidMount() {
        this.update();
    }

    async update() {
        try {
            const res = await fetch('/api/fetch');
            const speed_data = await res.json();
            this.setState({ speed_data });
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.update(), 1000);
    }

    render() {
        const { speed_data } = this.state;
        const data = speed_data.map(({ time, bytes }) => ({
            // time: new Date(time),
            time,
            'MB/sec': bytes / 1024 / 1024,
        }));
        console.warn(speed_data);
        return (
            <div className="App">
                <h1>S3 Speedometer</h1>
                <AreaChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                    }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey='time'
                        type='number'
                        domain={['dataMin', 'dataMax']}
                        ticks={[]}
                        hide={true}
                    />
                    <YAxis
                        dataKey='MB/sec'
                        type='number'
                        domain={[0, dataMax => {
                            if (dataMax < 30) return 30;
                            if (dataMax < 100) return 100;
                            if (dataMax < 300) return 300;
                            if (dataMax < 1000) return 1000;
                            return 5000;
                        }]}
                    />
                    <Area
                        type="monotone"
                        dataKey="MB/sec"
                        stroke="#8884d8"
                        fill="#8884d8"
                    />
                    <Legend />
                    <Tooltip />
                </AreaChart>
            </div>
        );
    }
}
