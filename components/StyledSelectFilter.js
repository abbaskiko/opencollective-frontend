import React from 'react';
import PropTypes from 'prop-types';

import StyledSelect from './StyledSelect';

const getSelectStyles = stylesFromProps => ({
  ...stylesFromProps,
  control: (baseStyles, state) => {
    const styles = {
      ...baseStyles,
      ...stylesFromProps?.control?.(baseStyles, state),
      borderRadius: 100,
      background: '#F7F8FA',
      padding: '0 8px',
      fontWeight: 500,
      borderColor: '#E8E9EB',
      '&:hover': {
        borderColor: '#C4C7CC',
      },
    };

    if (state.isFocused) {
      styles.background = 'white';
      styles.boxShadow = '0 0 0 2px black';
    }

    return styles;
  },
});

/**
 * A superset of `StyledSelect` with custom styles, to use for selects that contains
 * filters for lists.
 */
export const StyledSelectFilter = props => {
  const styles = React.useMemo(() => getSelectStyles(props.styles), [props.styles]);
  return (
    <StyledSelect minWidth={80} fontSize="12px" lineHeight="14px" isSearchable={false} {...props} styles={styles} />
  );
};

StyledSelectFilter.propTypes = {
  /** The id of the search input */
  inputId: PropTypes.string.isRequired,
  /** Define an id prefix for the select components e.g., {your-id}-value */
  instanceId: PropTypes.string,
  /** Placeholder for the select value */
  placeholder: PropTypes.node,
  /** Whether the component is disabled */
  disabled: PropTypes.bool,
  /** Additional styles for the component */
  styles: PropTypes.object,
};
