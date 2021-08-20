import { getPaginatedEvents, PaginatedEvent, SortCondition, SortDirection } from 'api';
import { FieldProps } from 'formik';
import { OptionsType, OptionTypeBase, ValueType } from 'react-select';
import AsyncSelect from 'react-select/async';
import React, { useEffect, useState } from 'react';
import { Option } from 'react-select/src/filters';


const DEFAULT_LIMIT = 100;


const defaultSortCond: SortCondition = {
    sort_by: 'name',
    sort_direction: SortDirection.ascending
};


type FormFilterReactSelectProps = {
    placeholder: string;
    label: string;
    name: string;
    disabled: boolean;
    onChange: (option: OptionTypeBase) => void;
    value?: OptionTypeBase;
    className?: string;
    cacheOptions?: any;
    limit?: number;
    isMulti?: boolean;
};


interface CustomSelectProps extends FieldProps {
    options: OptionsType<Option>;
    placeholder: string;
}


const colourStyles = {
    control: (styles: any) => ({
        ...styles,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#eef0fb',
        '&:hover': { borderColor: '#6534ff' },
    }),
    input: (styles: any) => ({ ...styles, height: 36 }),
};

const EventSelect: React.FC<OptionTypeBase> = ({
    placeholder,
    label,
    name,
    disabled,
    onChange,
    value,
    className,
    cacheOptions,
    isMulti,
    limit = DEFAULT_LIMIT
}) => {

    const convertEventsToOptions = (paginatedEvents: PaginatedEvent) => {
        return paginatedEvents.items.map<OptionTypeBase>((event) => ({
            value: event.id,
            label: event.name
        }));
    };

    let _timeoutId: NodeJS.Timeout;

    const loadOptions = (inputValue: string, callback: (options: OptionTypeBase[]) => void) => {
        if (_timeoutId) {
            clearTimeout(_timeoutId);
        }

        _timeoutId = setTimeout(async () => {
            const paginatedEvents = await getPaginatedEvents(
                inputValue !== '' ? inputValue : undefined,
                0,
                undefined,
                limit,
                defaultSortCond
            );

            const options = convertEventsToOptions(paginatedEvents);
            callback(options);
        }, 300);
    };

    console.log('Value', value);

    return <AsyncSelect
        cacheOptions={cacheOptions}
        loadOptions={loadOptions}
        placeholder={placeholder}
        label={label}
        name={name}
        loadingMessage={({ inputValue }) => 'Loading events...'}
        disabled={disabled}
        isMulti={isMulti}
        onChange={onChange}
        value={value}
        className={className}
        defaultOptions
    />
};

export const FormEventSelect = ({ field, form, options, placeholder }: CustomSelectProps) => {
    
    const onChange = (option: ValueType<OptionTypeBase>) => {
        form.setFieldValue(field.name, option);
    };

    return (
        <EventSelect
            name={field.name}
            value={field.value}
            onChange={onChange}
            placeholder={placeholder}
            className={'rselect'}
            styles={colourStyles}
        />
    );
};

export default EventSelect;