package com.carenmct.schedule.dto.copayconfirmation;

public record CopayAmountsDto(int count, int benefit, int insurance, int copay) {

    public static CopayAmountsDto empty() {
        return new CopayAmountsDto(0, 0, 0, 0);
    }
}
