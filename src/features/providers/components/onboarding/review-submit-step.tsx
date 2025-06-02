"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, FileText, User, Briefcase, Shield, Stethoscope, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReviewSubmitStepProps {
  data: any
  onDataChange: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function ReviewSubmitStep({ data, onPrevious }: ReviewSubmitStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      toast({
        title: "Terms and conditions required",
        description: "Please agree to the terms and conditions before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Application submitted successfully!",
        description:
          "Your provider application has been submitted for review. You'll receive an email confirmation shortly.",
      })

      // In a real app, you would redirect to a success page or dashboard
      // router.push('/dashboard/providers/application-status')
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const basicInfo = data?.basicInfo || {}
  const providerType = data?.providerType || {}
  const professionalDetails = data?.professionalDetails || {}
  const regulatoryRequirements = data?.regulatoryRequirements || {}
  const services = data?.services || {}

  const totalSteps = 5
  const completedSteps = [
    basicInfo.firstName,
    providerType.providerType,
    professionalDetails.medicalLicenseNumber,
    Object.keys(regulatoryRequirements).length > 0,
    services.consultationFee,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Review & Submit Application</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting your provider application.
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Application Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>Completed Steps</span>
            <Badge variant={completedSteps === totalSteps ? "default" : "secondary"}>
              {completedSteps}/{totalSteps}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={basicInfo.profileImage || "/placeholder.svg"} alt="Profile" />
              <AvatarFallback>
                {basicInfo.firstName?.[0]}
                {basicInfo.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">
                {basicInfo.firstName} {basicInfo.lastName}
              </h4>
              <p className="text-sm text-muted-foreground">{basicInfo.email}</p>
              <p className="text-sm text-muted-foreground">{basicInfo.phone}</p>
            </div>
          </div>
          {basicInfo.bio && (
            <div>
              <h5 className="font-medium mb-2">Professional Bio</h5>
              <p className="text-sm text-muted-foreground">{basicInfo.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Type Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Provider Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-sm">
            {providerType.providerType?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
        </CardContent>
      </Card>

      {/* Professional Details Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium">License Number</h5>
              <p className="text-sm text-muted-foreground">{professionalDetails.medicalLicenseNumber}</p>
            </div>
            <div>
              <h5 className="font-medium">Experience</h5>
              <p className="text-sm text-muted-foreground">{professionalDetails.yearsOfExperience}</p>
            </div>
          </div>
          <div>
            <h5 className="font-medium">Specializations</h5>
            <p className="text-sm text-muted-foreground">{professionalDetails.specializations}</p>
          </div>
          <div>
            <h5 className="font-medium">Languages Spoken</h5>
            <p className="text-sm text-muted-foreground">{professionalDetails.languagesSpoken}</p>
          </div>
          {professionalDetails.education && (
            <div>
              <h5 className="font-medium">Education & Qualifications</h5>
              <p className="text-sm text-muted-foreground">{professionalDetails.education}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regulatory Requirements Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Regulatory Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(regulatoryRequirements).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">{key.replace("_", " ")}</span>
                <div className="flex items-center gap-2">
                  {typeof value === "object" && value !== null ? (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Document Uploaded
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                    </span>
                  )}
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Services & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="font-medium">Consultation Fee</h5>
            <p className="text-lg font-semibold text-green-600">${services.consultationFee}</p>
          </div>

          {services.availableServices && services.availableServices.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Available Services</h5>
              <div className="flex flex-wrap gap-2">
                {services.availableServices.map((service: string) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {services.customServices && services.customServices.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Custom Services</h5>
              <div className="flex flex-wrap gap-2">
                {services.customServices.map((service: string) => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
          <CardDescription>
            Please review and accept the terms and conditions to complete your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </label>
              <p className="text-xs text-muted-foreground">
                By submitting this application, I confirm that all information provided is accurate and complete. I
                agree to the{" "}
                <a href="/terms-of-use" className="underline hover:text-primary">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="underline hover:text-primary">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>

        <Button onClick={handleSubmit} disabled={!agreedToTerms || isSubmitting} className="flex items-center gap-2">
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Application
            </>
          )}
        </Button>
      </div>

      {/* Next Steps Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Your application will be reviewed by our compliance team</li>
            <li>We'll verify your credentials and regulatory documents</li>
            <li>You'll receive email updates on your application status</li>
            <li>Once approved, you can start accepting bookings on the platform</li>
          </ol>
          <p className="text-xs mt-3 text-blue-600">
            Review typically takes 3-5 business days. You'll receive an email confirmation shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
