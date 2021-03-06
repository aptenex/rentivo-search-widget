import React from 'react';
import PropTypes from 'prop-types';
import PlacesAutocomplete, { geocodeByAddress } from 'react-places-autocomplete'
import loadGoogleMapsAPI from "load-google-maps-api-2";

import Cookie from '~core/Services/Cookie';
import { searchField } from '~core/defaults';

import { generateGooglePlacesPart } from './helpers/urlGenerator';

import './GooglePlaces.scss';

class GooglePlaces extends React.PureComponent {
    searchField = React.createRef();
    cookie = new Cookie();

    state = {
        address:          !this.props.dumb && this.cookie.get('SearchField.GooglePlaces.address') || '',
        searchResultData: !this.props.dumb && this.cookie.get('SearchField.GooglePlaces.searchResultData') || '',
    };

    constructor(props) {
        super(props);

        // look at description for "componentDidMount" code
        if (window.googlePlacesInstanceCount === undefined) {
            window.googlePlacesInstanceCount = 0;
        }
        this.googlePlacesInstanceId = ++window.googlePlacesInstanceCount;
    }

    generateUrlPart       = () => generateGooglePlacesPart(this.state.searchResultData);
    generateCustomUrlPart = () => null;

    handleChange = address => this.setState({ address });

    handleSelect = address => {
        this.setState({ address }, () => {
            if (!this.props.dumb) {
                this.cookie.set('SearchField.GooglePlaces.address', address)
            }
        });

        geocodeByAddress(address)
            .then(results => {
                const searchResultData = {
                    ...results[0],
                    rentivoDestinationField: address.replace(', ', '--')
                };

                this.setState({ searchResultData }, () => {
                    if (!this.props.dumb) {
                        this.cookie.set('SearchField.GooglePlaces.searchResultData', searchResultData)
                    }
                })
            })
            .catch(error => console.error('Error', error));
    };

    handleError = (status, clearSuggestions) => {
        const allowedErrorsStatuses = ['NOT_FOUND', 'ZERO_RESULTS'];
        if (!allowedErrorsStatuses.includes(status)) {
            clearSuggestions();
            throw new Error(`Google Maps API returned error with status: ${ status }`);
        }
    };

    // when we have multiple instances of widget with "GooglePlaces" search field mode - occurs multiple loading of google maps API, which leads to errors. To solve this problem I have to write this ugly code. If you find out the better way to solve this problem - be welcome to change this one
    componentDidMount() {
        if (!window.google) {
            if (!window.isGoogleApiLoading) {
                window.isGoogleApiLoading       = true;
                window.googlePlacesCallbackList = [];
                window.googlePlacesCallback     = () => {
                    window.googlePlacesCallbackList.forEach(callback => window[callback] && window[callback]());
                };

                loadGoogleMapsAPI({
                    key:       this.props.API_KEY,
                    libraries: ['places'],
                    language:  'en'
                }).then(() => {
                    window.googlePlacesCallback();
                });
            }

            window.googlePlacesCallbackList.push(`googlePlacesCallback_${ this.googlePlacesInstanceId }`);
        }
    }

    componentWillUnmount() {
        delete window.googlePlacesInstanceCount;
        delete window.isGoogleApiLoading;
        delete window.googlePlacesCallback;
        delete window.googlePlacesCallbackList;
    }

    render() {
        return (
            <div className="GooglePlaces">
                <PlacesAutocomplete
                    value={ this.state.address }
                    onChange={ this.handleChange.bind(this) }
                    onError={ this.handleError }
                    onSelect={ this.handleSelect }
                    googleCallbackName={ `googlePlacesCallback_${ this.googlePlacesInstanceId }` }
                    searchOptions={ this.props.searchOptions }
                >
                    { ({ getInputProps, suggestions, getSuggestionItemProps }) => (
                        <div>
                            <input
                                { ...getInputProps({
                                    placeholder: this.props.placeholder,
                                    className:   'location-search-input'
                                }) }
                            />
                            <ul className="autocomplete-dropdown-container">
                                { suggestions.map(suggestion => {
                                    const className = suggestion.active ? 'suggestion-item--active' : 'suggestion-item';
                                    // inline style for demonstration purpose
                                    const style     = suggestion.active
                                        ? { backgroundColor: '#fafafa', cursor: 'pointer' }
                                        : { backgroundColor: '#ffffff', cursor: 'pointer' };
                                    return (
                                        <li { ...getSuggestionItemProps(suggestion, { className, style }) }>
                                            <span>{ suggestion.description }</span>
                                        </li>
                                    )
                                }) }
                            </ul>
                        </div>
                    ) }
                </PlacesAutocomplete>
            </div>

        );
    }
}

GooglePlaces.propTypes = {
    API_KEY:       PropTypes.string.isRequired,
    placeholder:   PropTypes.string,
    searchOptions: PropTypes.object,
    dumb:          PropTypes.bool.isRequired
};

GooglePlaces.defaultProps = {
    ...searchField.googlePlaces,
    dumb: false
};

export default GooglePlaces;