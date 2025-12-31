(function ($) {
    "use strict";

    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseenter', function () {
                    $(this).find('.dropdown-toggle').dropdown('show');
                }).on('mouseleave', function () {
                    $(this).find('.dropdown-toggle').dropdown('hide');
                });
            } else {
                $('.navbar .dropdown').off('mouseenter').off('mouseleave');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);

        // Handle AJAX-loaded menu components
        $(document).ajaxComplete(function (event, xhr, settings) {
            if (settings.url.indexOf('menu') !== -1) {
                // Re-initialize hover logic for desktop
                toggleNavbarMethod();

                // For mobile, Bootstrap handles it via data-bs-toggle.
                // We just need to ensure the parent is closed when another opens if needed, 
                // but usually Bootstrap's logic is sufficient.
            }
        });
    });


    // Date and time picker
    $('.date').datetimepicker({
        format: 'L'
    });
    $('.time').datetimepicker({
        format: 'LT'
    });


    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });


    // Portfolio isotope and filter
    $(window).on('load', function () {
        var portfolioIsotope = $('.portfolio-container').isotope({
            itemSelector: '.portfolio-item',
            layoutMode: 'fitRows'
        });
        $('#portfolio-flters li').on('click', function () {
            $("#portfolio-flters li").removeClass('active');
            $(this).addClass('active');

            portfolioIsotope.isotope({ filter: $(this).data('filter') });
        });
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: false,
        loop: true,
    });

})(jQuery);

