import { createElement, useState } from 'react';

export default function WebDateTimePicker({ date, setDate }) {

    return createElement('input', {
        type: "date",
        value: date.toISOString().split('T')[0],
        onChange: (e) => setDate(new Date(e.target.value))
    })
}