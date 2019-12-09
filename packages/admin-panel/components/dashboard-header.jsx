import React from 'react'
import {
  AreaChart, Area, Tooltip, ResponsiveContainer,
} from 'recharts';

import { Columns, Column, DashboardHeader, WrapperBox, ValueBlock, StyledButton } from 'admin-bro/components'

const data = [
  { name: 'Page A', uv: 500, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const Header = (props) => {
  return (
    <DashboardHeader style={ {paddingBottom: '100px'} }>
      <Columns>
        <Column width={6}>
          <h1>Welcome to AZTEC</h1>
          <p>It is gsn admin panel</p>
          <p>You can control Dapps, Users, their ApiKeys and Transactions, make Refund etc.</p>
        </Column>
        <Column width={6} style={{ marginBottom: '-120px'}}>
          <div style={{ marginRight: '-29px' }}>
            <ResponsiveContainer width='100%' minHeight={300}>
              <AreaChart
                data={data}
                margin={{
                  top: 0, right: 0, left: 0, bottom: 0,
                }}
              >
                <Tooltip />
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#718AF4" stopOpacity={1}/>
                    <stop offset={1} stopColor="#718AF4" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="url('#splitColor')" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Column>
      </Columns>
    </DashboardHeader>
  )
}

export default Header