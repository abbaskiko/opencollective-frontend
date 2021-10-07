import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { has } from 'lodash';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { parseDateInterval, stripTime } from '../../../lib/date-utils';
import dayjs from '../../../lib/dayjs';

import { DateRange } from '../../DateRange';
import { Box, Flex } from '../../Grid';
import PeriodFilterPresetsSelect from '../../PeriodFilterPresetsSelect';
import PopupMenu from '../../PopupMenu';
import StyledButton from '../../StyledButton';
import StyledButtonSet from '../../StyledButtonSet';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledTooltip from '../../StyledTooltip';
import { Span } from '../../Text';

const DEFAULT_INTERVAL = { from: '', to: '', timezoneType: 'local' };

/**
 * Get a date range as stored internally from a `value` prop, that can be either an object
 * like { from, to } or a stringified value (see `encodeDateInterval`).
 */
const getIntervalFromValue = value => {
  const isIntervalObject = value => typeof value === 'object' && has(value, 'from') && has(value, 'to');
  const intervalFromValue = isIntervalObject(value) ? { ...value } : parseDateInterval(value);
  if (intervalFromValue.timezoneType === 'UTC') {
    const toUTC = date => (date ? dayjs.utc(date) : null);
    intervalFromValue.from = toUTC(intervalFromValue.from);
    intervalFromValue.to = toUTC(intervalFromValue.to);
  }

  return {
    from: stripTime(intervalFromValue.from),
    to: stripTime(intervalFromValue.to),
    timezoneType: intervalFromValue.timezoneType || 'local',
  };
};

/**
 * Update `interval` with a new value for `from` or `to` and return the updated interval
 * as a new object.
 */
const getNewInterval = (interval, changeField, newValue) => {
  const newInterval = { ...interval };
  newInterval[changeField] = stripTime(newValue);

  // Reset interval in case fromDate is after toDate
  if (newInterval.from && newInterval.to && newInterval.from > newInterval.to) {
    const fieldToReset = changeField === 'from' ? 'to' : 'from';
    newInterval[fieldToReset] = '';
  }

  return newInterval;
};

/**
 * Date is locally stored as '2020-01-01'. We need to force the time to make sure it's not modified
 * by timezones when parsed.
 */
const parseDateForDateRange = (dateStr, isEndOfDay) => {
  if (!dateStr) {
    return null;
  } else if (!isEndOfDay) {
    return new Date(`${dateStr}T00:00:00`);
  } else {
    return new Date(`${dateStr}T23:59:59`);
  }
};

const UTC_LABEL = defineMessage({ defaultMessage: 'Coordinated Universal Time' });
const getTimeZoneTypeName = (intl, timezone) => {
  if (timezone === 'local') {
    try {
      return intl.timeZone || dayjs.tz.guess();
    } catch {
      return '';
    }
  } else if (timezone === 'UTC') {
    return intl.formatMessage(UTC_LABEL);
  } else {
    return '';
  }
};

const TriggerContainer = styled(StyledButton)`
  min-height: 38px;
  outline: 0;
  background: #f7f8fa;
  padding: 0 16px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: hsl(0, 0%, 20%);

  svg {
    transition: color 0.2s;
  }

  &:hover {
    border-color: #c4c7cc;
    svg {
      color: #999999;
    }
  }

  &:active,
  &:focus {
    background: white;
    color: hsl(0, 0%, 20%);
    box-shadow: 0 0 0 2px black;
  }
`;

const PeriodFilter = ({ onChange, value, inputId, minDate, ...props }) => {
  const intl = useIntl();
  const intervalFromValue = React.useMemo(() => getIntervalFromValue(value), [value]);
  const [tmpDateInterval, setTmpDateInterval] = React.useState(intervalFromValue);
  const formattedMin = stripTime(minDate);

  const setDate = (changeField, date) => {
    setTmpDateInterval(getNewInterval(tmpDateInterval, changeField, date));
  };

  return (
    <PopupMenu
      placement="bottom-start"
      onClose={() => setTmpDateInterval(intervalFromValue)}
      Button={({ onClick }) => (
        <TriggerContainer onClick={onClick} id={inputId} data-cy="period-filter" {...props}>
          <Flex justifyContent="space-between" alignItems="center">
            <DateRange
              from={parseDateForDateRange(intervalFromValue.from, false)}
              to={parseDateForDateRange(intervalFromValue.to, true)}
              isUTC={intervalFromValue.timezoneType === 'UTC'}
            />
            <ChevronDown size={25} color="#cccccc" />
          </Flex>
        </TriggerContainer>
      )}
    >
      {({ setOpen }) => (
        <Box mx="8px" my="8px" width="190px">
          <Box mb={3}>
            <PeriodFilterPresetsSelect
              inputId={`${inputId}-presets-select`}
              onChange={setTmpDateInterval}
              interval={tmpDateInterval}
            />
          </Box>
          <StyledInputField
            label={<FormattedMessage defaultMessage="Start date" />}
            labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
            name="dateFrom"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                width="100%"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={stripTime(tmpDateInterval.from)}
                min={formattedMin}
                onChange={e => setDate('from', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledInputField
            label={<FormattedMessage defaultMessage="End date" />}
            labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
            name="dateTo"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                width="100%"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={stripTime(tmpDateInterval.to)}
                min={formattedMin}
                max={stripTime(new Date())}
                onChange={e => setDate('to', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledInputField
            name="timezoneType"
            mt="12px"
            labelFontSize="13px"
            label={
              <Flex alignItems="center">
                <StyledTooltip
                  content={
                    <FormattedMessage defaultMessage="By default, all dates are filtered and displayed using your local timezone. You can switch to UTC to indicate that the dates provided above use the Coordinated Universal Time format, which matches how email reports are generated" />
                  }
                >
                  <InfoCircle size={16} />
                </StyledTooltip>
                <Span ml={1}>
                  <FormattedMessage defaultMessage="Timezone" />
                </Span>
              </Flex>
            }
          >
            {inputProps => (
              <StyledButtonSet
                {...inputProps}
                size="tiny"
                items={['local', 'UTC']}
                buttonProps={{ p: 1, fontSize: '11px' }}
                selected={tmpDateInterval.timezoneType}
                buttonPropsBuilder={({ item }) => ({ title: getTimeZoneTypeName(intl, item) })}
                onChange={timezoneType => {
                  setTmpDateInterval({ ...tmpDateInterval, timezoneType });
                }}
              >
                {({ item }) => {
                  switch (item) {
                    case 'local':
                      return <FormattedMessage defaultMessage="Local" />;
                    case 'UTC':
                      return <FormattedMessage defaultMessage="UTC" />;
                  }
                }}
              </StyledButtonSet>
            )}
          </StyledInputField>
          <Flex mt={2}>
            <StyledButton
              buttonSize="tiny"
              mr={2}
              mt="12px"
              flex="1"
              onClick={() => {
                setTmpDateInterval(DEFAULT_INTERVAL);
                setOpen(false);
                onChange(null);
              }}
            >
              <FormattedMessage id="Reset" defaultMessage="Reset" />
            </StyledButton>
            <StyledButton
              buttonSize="tiny"
              buttonStyle="primary"
              mt="12px"
              data-cy="btn-apply-period-filter"
              flex="1"
              onClick={() => {
                onChange(tmpDateInterval);
                setOpen(false);
              }}
            >
              <FormattedMessage id="Apply" defaultMessage="Apply" />
            </StyledButton>
          </Flex>
        </Box>
      )}
    </PopupMenu>
  );
};

PeriodFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  /** The value, either as a string with the `dateFrom→dateTo` format or an object like { from, to }*/
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string,
      timezoneType: PropTypes.string,
    }),
  ]),
  inputId: PropTypes.string,
  minDate: PropTypes.string,
};

export default PeriodFilter;
