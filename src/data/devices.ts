// 设备数据配置文件

export interface Device {
    name: string;
    image: string;
    specs: string;
    description: string;
    link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = {
    [categoryName: string]: Device[];
} & {
    //自定义?: Device[];
};

export const devicesData: DeviceCategory = {
    OnePlus: [
        {
            name: "OnePlus 12",
            image: "/images/device/oneplus12.jpg",
            specs: "Snapdragon 8gen3 Black / 16GB + 512GB",
            description: "Never Settle",
            link: "https://www.oneplus.com/cn/12",
        },
    ],
    ROG: [
        {
            name: "Zephyrus G14 2025",
            image: "/images/device/Zephyrus.png",
            specs: "Ryzen AI 9 HX 370 White / 32GB + 1TB",
            description: "Performance, Uncompromised.",
            link: "https://rog.asus.com.cn/laptops/rog-zephyrus/rog-zephyrus-g14-2025/",
        },
    ],


};
