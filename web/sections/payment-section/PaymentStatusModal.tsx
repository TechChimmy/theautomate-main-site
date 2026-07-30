'use client';

import React from 'react';
import { CheckCircle2, XCircle, Loader2, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalProps {
    isOpen: boolean;
    status: 'success' | 'error' | 'loading';
    message: string;
    orderId?: string;
    redirectUrl?: string;
    onClose: () => void;
}

export default function PaymentStatusModal({ isOpen, status, message, orderId, redirectUrl, onClose }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={status !== 'loading' ? onClose : undefined}
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-8 text-center space-y-6">
                    {/* Icon Section */}
                    <div className="flex justify-center">
                        {status === 'success' && (
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                <XCircle className="w-12 h-12" />
                            </div>
                        )}
                        {status === 'loading' && (
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-[#1E90FF]">
                                <Loader2 className="w-12 h-12 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-[#0A3D62]">
                            {status === 'success' ? 'Payment Successful!' :
                                status === 'error' ? 'Payment Failed' : 'Processing...'}
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    {status !== 'loading' && (
                        <div className="pt-4 flex flex-col gap-3">
                            {status === 'success' ? (
                                <>
                                    <Button
                                        onClick={() => window.location.href = redirectUrl || '/courses'}
                                        className="w-full bg-[#1B262C] hover:bg-gray-800 h-14 rounded-2xl font-bold shadow-lg"
                                    >
                                        <Home className="w-5 h-5 mr-3" />
                                        Go to Courses
                                    </Button>
                                    {orderId && (
                                        <Button
                                            onClick={() => window.open(`/api/invoice/${orderId}`, '_blank')}
                                            variant="outline"
                                            className="w-full h-14 rounded-2xl font-bold shadow-sm border-2 border-[#1B262C] text-[#1B262C] hover:bg-gray-50"
                                        >
                                            Download Invoice
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Button
                                    onClick={onClose}
                                    className="w-full bg-[#1B262C] hover:bg-gray-800 h-14 rounded-2xl font-bold shadow-lg"
                                >
                                    <RotateCcw className="w-5 h-5 mr-3" />
                                    Try Again
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Accent */}
                <div className={`h-2 w-full ${status === 'success' ? 'bg-green-500' :
                    status === 'error' ? 'bg-red-500' : 'bg-[#1E90FF]'
                    }`} />
            </div>
        </div>
    );
}
