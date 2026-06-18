package com.whoiszxl.zhipin.member.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Schema(description = "Simple option item")
public class OptionItemResponse {

    @Schema(description = "Option value")
    private String value;

    @Schema(description = "Display label")
    private String label;

    @Schema(description = "Child options")
    private List<OptionItemResponse> children = new ArrayList<>();

    public OptionItemResponse(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public OptionItemResponse(String value, String label, List<OptionItemResponse> children) {
        this.value = value;
        this.label = label;
        this.children = children;
    }
}
