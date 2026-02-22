"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Phone, MapPin, Home, Loader2, ArrowRight, CheckCircle } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = formData.firstName.length >= 2 && formData.lastName.length >= 2;
  const canProceedStep2 = formData.phone.length >= 10;
  const canProceedStep3 = formData.addressLine1.length >= 5 && formData.city.length >= 2 && formData.postcode.length >= 5;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save details");
      }

      toast.success("Profile setup complete! 🎉");
      router.push("/disputes");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to save your details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep > step
                    ? "bg-green-500 text-white"
                    : currentStep === step
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    currentStep > step ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
          {/* Step 1: Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome to DisputeHub!</h1>
                <p className="text-slate-500 mt-2">Let's set up your profile so we can personalize your dispute letters.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName" className="text-slate-900">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Enter your first name"
                    className="mt-1.5 bg-white border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-slate-900">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Enter your last name"
                    className="mt-1.5 bg-white border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Phone */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Contact Number</h1>
                <p className="text-slate-500 mt-2">This will appear on your official dispute letters.</p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-slate-900">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="e.g., 07123 456789"
                  className="mt-1.5 bg-white border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-700"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Your Address</h1>
                <p className="text-slate-500 mt-2">Used as the sender address on dispute letters.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="addressLine1" className="text-slate-900">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => updateField("addressLine1", e.target.value)}
                    placeholder="e.g., 123 High Street"
                    className="mt-1.5 bg-white border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="addressLine2" className="text-slate-900">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => updateField("addressLine2", e.target.value)}
                    placeholder="e.g., Flat 4B"
                    className="mt-1.5 bg-white border-slate-200 text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-slate-900">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="e.g., London"
                      className="mt-1.5 bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode" className="text-slate-900">Postcode *</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => updateField("postcode", e.target.value.toUpperCase())}
                      placeholder="e.g., SW1A 1AA"
                      className="mt-1.5 bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-700"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedStep3 || isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Skip option */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                router.push("/disputes");
              }}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Skip for now (you can add this later in Settings)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
