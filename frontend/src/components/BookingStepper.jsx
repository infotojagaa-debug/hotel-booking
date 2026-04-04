import React from 'react';
import { FaCheck } from 'react-icons/fa';
import './BookingStepper.css';

const BookingStepper = ({ currentStep = 1 }) => {
    const steps = [
        { id: 1, label: 'Your Selection' },
        { id: 2, label: 'Your Details' },
        { id: 3, label: 'Payment' }
    ];

    return (
        <div className="booking-stepper-container">
            <div className="booking-stepper-flex">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className={`booking-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                            <div className="step-icon-wrap">
                                {currentStep > step.id ? <FaCheck /> : step.id}
                            </div>
                            <span className="step-label">{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="step-connector"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default BookingStepper;
