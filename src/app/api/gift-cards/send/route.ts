// src/app/api/gift-cards/send/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { GiftCardEmail } from '@/components/emails/GiftCardEmail'
import { generatePDF } from '@/lib/pdf/gift-card-pdf'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { cardId, generatePDF: shouldGeneratePDF } = await request.json()

    // Validate input
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      )
    }

    // Fetch gift card data
    const { data: card, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gift card' },
        { status: 404 }
      )
    }

    if (!card) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Generate PDF if requested
    let pdfBuffer = null
    let pdfUrl = null

    if (shouldGeneratePDF) {
      try {
        pdfBuffer = await generatePDF(card)
        
        // Store PDF in Supabase Storage
        const fileName = `gift-card-${card.code}-${Date.now()}.pdf`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gift-cards')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          })

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('gift-cards')
            .getPublicUrl(fileName)
          
          pdfUrl = publicUrl
          
          // Update card with PDF URL
          await supabase
            .from('gift_cards')
            .update({ pdf_url: publicUrl })
            .eq('id', cardId)
        }
      } catch (pdfError) {
        console.error('❌ PDF generation error:', pdfError)
        // Continue without PDF if generation fails
      }
    }

    // ✅ Render email HTML - FIXED: Added await
    const html = await render(
      GiftCardEmail({
        card: {
          code: card.code,
          amount: card.amount,
          recipient_name: card.recipient_name,
          sender_name: card.sender_name || 'Mystic Wines',
          message: card.message || '',
          expires_at: card.expires_at,
        },
        giftCardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gift-cards/${card.code}`,
        companyName: 'Mystic Wines',
        companyLogo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
      })
    )

    // Prepare attachments
    const attachments = []
    if (pdfBuffer) {
      attachments.push({
        filename: `gift-card-${card.code}.pdf`,
        content: Buffer.from(pdfBuffer).toString('base64'),
        contentType: 'application/pdf'
      })
    }

    // Send email with Resend
    const { data, error: emailError } = await resend.emails.send({
    //   from: 'Mystic Wines <gifts@mysticwines.co.ke>',
      from: 'onboarding@resend.dev',
      to: [card.recipient_email],
      subject: `🎁 You've received a gift card from ${card.sender_name || 'Mystic Wines'}`,
      html, // ✅ Now html is a string, not a Promise
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (emailError) {
      console.error('❌ Email error:', emailError)
      throw new Error(emailError.message || 'Failed to send email')
    }

    // Update delivery status
    await supabase
      .from('gift_cards')
      .update({ 
        delivery_status: 'sent',
        delivered_at: new Date().toISOString()
      })
      .eq('id', cardId)

    return NextResponse.json({ 
      success: true, 
      emailId: data?.id || null,
      cardId: card.id,
      pdfUrl: pdfUrl || null
    })

  } catch (error: any) {
    console.error('❌ Send gift card error:', error)
    
    // If there's a cardId in the error, update status to failed
    if (error.cardId) {
      await supabase
        .from('gift_cards')
        .update({ delivery_status: 'failed' })
        .eq('id', error.cardId)
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send gift card' },
      { status: 500 }
    )
  }
}