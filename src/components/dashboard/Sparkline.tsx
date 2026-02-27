'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { SparklinePoint } from '@/hooks/use-dashboard-metrics'

interface SparklineProps {
    data: SparklinePoint[]
    color: string
}

export function Sparkline({ data, color }: SparklineProps) {
    if (!data || data.length === 0) return null

    return (
        <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                <defs>
                    <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#spark-${color.replace('#', '')})`}
                    dot={false}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
