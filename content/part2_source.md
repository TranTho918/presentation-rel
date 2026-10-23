# Giải pháp MaskablePPO và quá trình huấn luyện

## 1. Từ tương tác với môi trường đến học chính sách

Trong bài toán điều phối xe buýt, môi trường đã xác định thông tin agent quan sát được, các hành động có thể thực hiện và reward phản ánh chi phí phục vụ, vận hành. Mỗi hai phút, agent nhận observation và action mask, chọn một quyết định rồi nhận reward cùng observation tiếp theo.

Điều cần học là một **chính sách điều phối — policy**: với thông tin hiện có, agent nên ưu tiên hành động nào để giảm chi phí trong cả ca. Policy được biểu diễn bằng mạng nơ-ron có trọng số θ. Huấn luyện là quá trình điều chỉnh các trọng số này từ trải nghiệm tương tác với simulator.

Agent không được cung cấp nhãn “đây là action tối ưu” cho từng tình huống. Nó học từ hệ quả của những hành động đã thực hiện. Một action có thể gây chi phí ngay lập tức nhưng mang lại lợi ích sau nhiều bước. Chẳng hạn, dispatch một xe dự phòng làm tăng chi phí chạy rỗng trước khi xe tới tuyến, nhưng có thể giảm thời gian chờ và số hành khách bỏ cuộc về sau.

Vì vậy, mục tiêu không phải chỉ tối đa hóa reward của bước kế tiếp mà là tối đa hóa **tổng reward kỳ vọng**.

$$
G_t=\sum_{k=t}^{T-1}\gamma^{k-t}r_k
$$

Trong đó, Gₜ là return từ bước t đến cuối episode, rₖ là reward từng bước, γ là hệ số chiết khấu và T là số bước của episode.

$$
J(\theta)=\mathbb{E}_{\pi_\theta}[G_0]
$$

Repo sử dụng γ = 1 trong episode hữu hạn 240 phút. Reward ở cuối ca không bị giảm trọng số chỉ vì xuất hiện muộn hơn. Do reward được tính từ chi phí âm đã chuẩn hóa, tối đa hóa tổng reward tương ứng với tối thiểu hóa tổng chi phí theo hàm mục tiêu.

## 2. Policy gradient: học trực tiếp cách chọn hành động

Với action rời rạc, policy tạo một điểm số gọi là **logit** cho mỗi action. Hàm softmax chuyển các điểm số thành phân phối xác suất:

$$
\pi_\theta(a\mid x)=\frac{\exp(z_a(x))}{\sum_b\exp(z_b(x))}
$$

x là thông tin quan sát và lịch sử mà policy sử dụng, không phải toàn bộ state ẩn của simulator. zₐ(x) là logit của action a.

Khi train, agent lấy mẫu action theo phân phối này. Nhờ đó, nó có thể khám phá nhiều cách điều phối thay vì luôn chọn một hành động từ đầu. Sau khi quan sát kết quả, quá trình học khuyến khích tăng xác suất của những lựa chọn tốt hơn kỳ vọng và giảm ưu tiên những lựa chọn kém hơn kỳ vọng.

**Policy gradient** là cách cập nhật trọng số theo gradient của mục tiêu reward. Với γ = 1 như cấu hình dự án, dạng ước lượng cơ bản có thể viết:

$$
\widehat{g}\propto\sum_t\nabla_\theta\log\pi_\theta(a_t\mid x_t)\,w_t
$$

wₜ là tín hiệu chấm chất lượng action đã chọn. Gradient của log probability cung cấp hướng thay đổi trọng số; wₜ quyết định mức độ và chiều khuyến khích của mẫu đó. Khi tính gradient actor, wₜ được coi là tín hiệu cố định.

Simulator không cần khả vi. Việc lấy đạo hàm diễn ra qua mạng policy, còn môi trường cung cấp trải nghiệm để ước lượng hướng cải thiện.

## 3. REINFORCE: học từ return thực tế

Một cách cơ bản để xác định wₜ là sử dụng return thực tế sau khi chạy hết episode. Đây là ý tưởng của **REINFORCE**.

Quá trình gồm thu một hoặc nhiều episode, tính return từ mỗi bước về cuối episode, rồi dùng các return đó để cập nhật policy. Với γ = 1:

$$
G_t=r_t+r_{t+1}+\cdots+r_{T-1}
$$

Chỉ reward từ bước t trở đi được dùng để chấm action tại t, vì action hiện tại không thể thay đổi chi phí đã xảy ra trước đó.

Hạn chế là phải chờ kết quả cuối ca và return dễ bị nhiễu bởi demand, traffic. Một ngày dễ có thể cho return tốt dù policy chưa giỏi; một ngày khó có thể cho return kém dù agent xử lý khá tốt. Do đó, các lô dữ liệu có thể tạo ra hướng cập nhật dao động mạnh.

Một cách giảm độ nhiễu là trừ **baseline**, tức mức return kỳ vọng ứng với tình huống đang xét:

$$
w_t=G_t-b(x_t)
$$

Thay vì chỉ hỏi tổng điểm đạt được là bao nhiêu, ta hỏi kết quả tốt hơn hay kém hơn mức kỳ vọng bao nhiêu. Baseline này là số tham chiếu trong thuật toán học; khác với các controller Fixed, Proportional và Threshold dùng để so sánh thực nghiệm.

REINFORCE cung cấp nền tảng để hiểu policy gradient. Trainer của dự án sử dụng MaskablePPO, không chạy REINFORCE như một thuật toán so sánh.

## 4. Actor–Critic: kết hợp quyết định và ước lượng

Để học mà không phải luôn đợi return đầy đủ của cả episode, có thể bổ sung một bộ ước lượng phần reward tương lai. Cấu trúc này dẫn đến **Actor–Critic**.

| Thành phần | Chức năng | Đầu ra |
|---|---|---|
| Actor πθ | Quyết định nên ưu tiên action nào | Phân phối xác suất hành động |
| Critic Vφ | Ước lượng return còn lại nếu tiếp tục policy hiện tại | Một giá trị vô hướng |

Critic học một hàm value xấp xỉ từ thông tin đầu vào. Nó không biết trước nhu cầu hoặc giao thông tương lai, mà dự đoán dựa trên dữ liệu đã trải nghiệm.

Sau một bước, agent đã biết reward thật rₜ và observation tiếp theo. Thay vì chờ toàn bộ tương lai, có thể kết hợp reward vừa nhận với value dự đoán ở bước sau:

$$
y_t=r_t+\gamma(1-d_t)V_\phi(x_{t+1})
$$

dₜ = 1 nếu bước đó kết thúc episode thật; ngược lại dₜ = 0. Cách dùng dự đoán value để hoàn thiện target được gọi là **bootstrapping**.

Chênh lệch giữa target mới và dự đoán hiện tại là **Temporal Difference error — TD error**:

$$
\delta_t=r_t+\gamma(1-d_t)V_\phi(x_{t+1})-V_\phi(x_t)
$$

Ví dụ minh họa: V(xₜ) = −20, reward vừa nhận là −1 và V(xₜ₊₁) = −17. Với γ = 1 và episode chưa kết thúc, target bằng −18, TD error bằng +2. Hệ quả vừa quan sát tốt hơn dự đoán ban đầu 2 điểm, dù reward vẫn âm.

Actor dùng tín hiệu chất lượng để điều chỉnh cách chọn action. Critic giảm sai số giữa value dự đoán và target. Nếu hai thành phần chia sẻ encoder, cả actor loss và critic loss đều có thể cập nhật phần biểu diễn chung.

Bootstrapping cho phép học từ các đoạn trải nghiệm, nhưng đưa sai số critic vào tín hiệu học. Trong môi trường quan sát không đầy đủ, value còn phụ thuộc khả năng biểu diễn thông tin của encoder.

## 5. Advantage và Generalized Advantage Estimation

**Advantage** thể hiện mức độ một action tốt hơn hoặc kém hơn mức kỳ vọng của policy trong tình huống đang xét. Trong huấn luyện, advantage được ước lượng bằng:

$$
\widehat{A}_t=\widehat{G}_t-V_{old}(x_t)
$$

Ĝₜ là return target ước lượng; V_old là value tính bằng mạng lúc thu dữ liệu, trước vòng cập nhật hiện tại.

Advantage dương cho biết kết quả tốt hơn kỳ vọng; advantage âm cho biết kết quả kém hơn kỳ vọng. Điều này giúp phân biệt chất lượng action ngay cả khi mọi reward đều âm. Return target −18 so với value −20 tạo advantage +2.

Repo sử dụng **Generalized Advantage Estimation — GAE**, kết hợp TD error qua nhiều bước:

$$
\delta_t=r_t+\gamma(1-d_t)V_{old}(x_{t+1})-V_{old}(x_t)
$$

$$
\widehat{A}_t=\delta_t+\gamma\lambda(1-d_t)\widehat{A}_{t+1}
$$

GAE được tính ngược theo thời gian trong rollout. Hệ số λ điều chỉnh mức đóng góp của TD error ở các bước xa hơn. λ nhỏ phụ thuộc nhiều vào dự đoán ngắn hạn của critic; λ lớn sử dụng hiệu ứng dài hơn nhưng có thể làm tín hiệu nhiễu hơn. Cấu hình dự án dùng γ = 1 và λ = 0,95.

Sau khi tính advantage, target của critic là:

$$
\widehat{G}_t=\widehat{A}_t+V_{old}(x_t)
$$

Nếu episode kết thúc, không bootstrap sang ca mới và không nối advantage qua ranh giới hai episode. Nếu chỉ hết đoạn rollout mà episode vẫn tiếp tục, sử dụng value ở cuối đoạn để bootstrap. Vì vậy, return target không nhất thiết là return Monte Carlo hoàn chỉnh của cả ca.

## 6. Từ A2C đến PPO

**Advantage Actor–Critic — A2C** tổ chức việc học bằng cách thu trải nghiệm từ nhiều môi trường sử dụng cùng policy, gom dữ liệu, tính advantage và cập nhật chung. Việc gom rollout giúp học từ các đoạn tương tác thay vì bắt buộc chờ toàn bộ episode.

Actor loss cơ bản có dạng:

$$
L_{actor}=-\mathbb{E}[\log\pi_\theta(a_t\mid x_t)\widehat{A}_t]
$$

Tuy nhiên, nếu cập nhật quá mạnh, policy sau học có thể khác nhiều so với policy đã tạo ra dữ liệu. Tái sử dụng cùng rollout nhiều lần với objective cơ bản có thể làm vấn đề rõ hơn.

**Proximal Policy Optimization — PPO** giữ cấu trúc actor–critic và advantage, đồng thời thay objective actor để kiểm soát động lực thay đổi policy. PPO sử dụng tỷ lệ xác suất giữa policy mới và policy cũ, kết hợp clipping để học nhiều minibatch và nhiều epoch trên một rollout thận trọng hơn.

A2C ở đây là bước giải thích dẫn tới PPO; báo cáo standard-v1 không thực hiện so sánh A2C với MaskablePPO.

## 7. PPO: probability ratio và clipping

### 7.1. Tỷ lệ xác suất mới và cũ

Khi thu rollout, trainer lưu log probability của action đã chọn dưới policy cũ. Khi cập nhật, policy hiện tại tính lại xác suất của chính action đó trên cùng đầu vào:

$$
\rho_t(\theta)=\frac{\pi_\theta(a_t\mid x_t)}{\pi_{old}(a_t\mid x_t)}
$$

ρ = 1 nghĩa là xác suất chưa đổi; ρ = 1,5 nghĩa là xác suất tăng lên 1,5 lần; ρ = 0,5 nghĩa là xác suất còn một nửa. Chẳng hạn, tăng từ 0,2 lên 0,3 tạo tỷ lệ 1,5.

Trong tính toán, ratio được lấy từ log probability:

$$
\rho_t=\exp(\log\pi_\theta-\log\pi_{old})
$$

### 7.2. Clipped surrogate objective

Objective actor của PPO-Clip là:

$$
L^{clip}(\theta)=\mathbb{E}\left[\min\left(\rho_t\widehat{A}_t,\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\widehat{A}_t\right)\right]
$$

Repo sử dụng ε = 0,2, tạo vùng tham chiếu ratio [0,8; 1,2]. Objective được tối đa hóa, nên phép min chọn giá trị thận trọng hơn giữa nhánh thường và nhánh clip.

Với advantage dương, actor được khuyến khích tăng xác suất action. Khi ratio vượt 1,2, objective của mẫu không tiếp tục tăng theo hướng đó. Với advantage âm, actor được khuyến khích giảm xác suất; khi ratio xuống dưới 0,8, objective không tiếp tục cải thiện nhờ giảm thêm theo hướng đó.

| Ví dụ minh họa | ρÂ | clip(ρ)Â | Giá trị lấy min |
|---|---:|---:|---:|
| Â = +2, ρ = 1,5 | 3 | 2,4 | 2,4 |
| Â = −2, ρ = 0,5 | −1 | −1,6 | −1,6 |

Clipping giới hạn động lực của surrogate objective ở một phía. Nó không ép mọi xác suất mới chỉ được thay đổi tối đa 20%, không tạo ràng buộc cứng lên khoảng cách giữa hai policy và không bảo đảm chất lượng tăng sau mỗi cập nhật. Các mẫu khác, encoder chung, critic loss và entropy vẫn có thể tác động lên trọng số.

### 7.3. Loss tổng hợp

Quá trình cập nhật kết hợp policy loss, value loss và entropy bonus:

$$
L=-L^{clip}+0.5\,\mathbb{E}[(V_\phi(x_t)-\widehat{G}_t)^2]-0.01\,\mathbb{E}[\mathcal{H}(\pi_\theta)]
$$

Policy loss khuyến khích action có advantage tốt thông qua PPO objective. Value loss giúp critic dự đoán return target chính xác hơn. Entropy bonus khuyến khích policy tiếp tục khám phá, hạn chế việc tập trung quá sớm vào một action.

Learning rate là 0,0003. Trước bước optimizer, gradient được giới hạn norm tối đa 0,5. **Gradient clipping** giới hạn độ lớn gradient; **PPO clipping** tác động lên objective thông qua probability ratio. Đây là hai cơ chế khác nhau.

## 8. Vì sao chọn MaskablePPO?

Không gian action của bài toán là Discrete(221), nhưng tính hợp lệ thay đổi theo từng thời điểm. Một xe có thể đang chở khách, chưa hết cooldown hoặc không đủ điều kiện rút khỏi tuyến. Các slot dành cho xe và tuyến padding cũng không thể thực thi.

PPO thông thường chưa tự xử lý những ràng buộc này. **MaskablePPO** bổ sung action masking vào phân phối hành động và quy trình huấn luyện PPO.

Actor vẫn tạo đủ 221 logits. Môi trường tính mask mₜ, trong đó mₜ(a) = 1 nếu action hợp lệ và bằng 0 nếu không hợp lệ. Phân phối sau mask là:

$$
\pi_\theta^{mask}(a\mid x,m)=\frac{m(a)\exp(z_a(x))}{\sum_bm(b)\exp(z_b(x))}
$$

Action không hợp lệ có xác suất bằng 0; các action hợp lệ được chuẩn hóa lại. Một action có logit cao vẫn bị loại nếu vi phạm điều kiện thực thi. NOOP luôn hợp lệ trước terminal, nên agent vẫn có lựa chọn khi chưa thể can thiệp khác.

MaskablePPO phù hợp với dự án vì kết hợp được bốn yêu cầu: action rời rạc; tính hợp lệ thay đổi theo tình huống; mục tiêu có tác động dài hạn; và quy trình actor–critic/PPO có sẵn trong thư viện để triển khai, đánh giá nhất quán.

Môi trường quyết định hành động nào được phép, còn policy học cách lựa chọn trong tập được phép đó. Mask không cần được học như một nhãn phụ. Nó cũng không thay thế critic, không dự báo nhu cầu tương lai và không tự bảo đảm phương án được chọn có hiệu quả phục vụ cao nhất.

Mask phải tham gia cả thu dữ liệu, cập nhật và đánh giá. Mỗi mẫu rollout lưu mask ứng với thời điểm action được chọn. Khi optimize, xác suất mới và cũ phải được tính với cùng mask đó:

$$
\rho_t(\theta)=\frac{\pi_\theta^{mask}(a_t\mid x_t,m_t)}{\pi_{old}^{mask}(a_t\mid x_t,m_t)}
$$

Không sử dụng mask của trạng thái môi trường mới nhất để cập nhật một mẫu cũ. Entropy cũng được tính trên phân phối hành động hợp lệ.

## 9. Kiến trúc policy và ba cấu hình trong standard-v1

Trainer khởi tạo `MaskablePPO("MultiInputPolicy", ...)`. MultiInputPolicy nhận observation dạng Dict, sau đó dùng encoder để tạo đặc trưng chung cho actor và critic.

```text
Observation Dict
       ↓
Encoder → 128 shared features
       ├── Actor hidden 128 → 221 logits → Action mask → Action
       └── Critic hidden 128 → 1 value
```

Actor và critic chia sẻ feature extractor, sau đó có head riêng. Trong triển khai này, mask được truyền vào phân phối actor; critic dự đoán value từ observation, không được truyền trực tiếp action mask.

Báo cáo standard-v1 so sánh ba cấu hình encoder của **cùng thuật toán MaskablePPO**:

| Cấu hình | Cửa sổ lịch sử | Cách biểu diễn đầu vào |
|---|---|---|
| RL-MLP10 | 10 phút | Làm phẳng các tensor quan sát, đưa qua MLP feed-forward |
| RL-GRU10 | 10 phút | Kết hợp raw features với đặc trưng GRU đọc lịch sử arrivals |
| RL-Belief20-fade | 20 phút | Bổ sung đặc trưng ước lượng demand rate Gamma–Poisson, giảm trọng số dữ liệu cũ |

**MLP10** sử dụng shared MLP với các lớp 256 và 128, rồi tách hai head actor/critic. Đây là cách biểu diễn trực tiếp, không có bộ mã hóa chuỗi riêng.

**GRU10** đọc lịch sử arrivals từ cũ đến mới, tạo 32 đặc trưng rồi ghép với các tensor quan sát đã làm phẳng. MLP tiếp theo tạo 128 shared features. Chiều rộng lớp ẩn được điều chỉnh để giữ ngân sách tham số gần encoder MLP gốc.

GRU này chỉ đọc lại cửa sổ lịch sử trong mỗi observation, khởi tạo hidden state lại mỗi forward. Nó không duy trì hidden state xuyên suốt các quyết định như một recurrent policy, và trainer vẫn là MaskablePPO. Vì mỗi mẫu có đủ cửa sổ lịch sử của chính nó, các mẫu vẫn có thể được xáo trộn để học minibatch.

**Belief20-fade** sử dụng prior shape/rate bằng 0,1/0,1 và decay bằng 0,8 để tạo đặc trưng demand rate từ lịch sử arrivals. Dữ liệu cũ đóng góp ít hơn dữ liệu mới. Đây là xấp xỉ cục bộ cường độ nhu cầu, không phải belief state đầy đủ của POMDP.

Default hiện tại của source là GRU10. Tuy nhiên, báo cáo standard-v1 chứa cả ba cấu hình; kết quả của MLP10 hoặc Belief20-fade phải được gắn với đúng encoder, không quy thành kết quả GRU10 chỉ vì GRU là default.

## 10. Cấu hình huấn luyện chung

standard-v1 giữ cùng thuật toán, môi trường, action masking và ngân sách train giữa các cấu hình để so sánh cách mã hóa observation.

| Thành phần | Thiết lập |
|---|---|
| Dữ liệu | 500 ngày train, 100 ngày validation |
| Model seeds | 11, 22, 33 |
| Ngân sách | 245.760 transitions cho mỗi cấu hình và mỗi seed |
| Số môi trường | 4 |
| Số bước thu mỗi môi trường | 256 |
| Minibatch size | 256 |
| Epoch mỗi rollout | 4 |
| Learning rate | 0,0003 |
| Gamma / GAE lambda | 1,0 / 0,95 |
| PPO clip range | 0,2 |
| Value / entropy coefficient | 0,5 / 0,01 |
| Max gradient norm | 0,5 |
| Validation frequency | 12.288 training transitions |
| Runtime study | Rust, CPU, 2 Torch threads, evaluation batch 16 |
| Điều khiển | REASSIGN và SHORT_TURN bật; forecast và reward shaping tắt |

Ba encoder và ba seed tạo thành chín run huấn luyện riêng. Các seed thay đổi yếu tố ngẫu nhiên của quá trình học, giúp quan sát mức biến thiên giữa các lần train.

500 ngày train là tập kịch bản dùng để tạo trải nghiệm, không có nghĩa trainer chỉ duyệt mỗi ngày đúng một lần. Ngân sách huấn luyện được đo bằng transitions thu từ môi trường. Các ngày validation được dùng để chấm và chọn checkpoint, không đưa vào rollout để cập nhật trọng số.

## 11. Thu thập rollout

**Episode** là một ca mô phỏng 240 phút, có 120 quyết định với khoảng điều khiển hai phút. **Transition** là trải nghiệm của một lần ra quyết định. **Rollout batch** là lô trải nghiệm thu trước một vòng cập nhật.

Với bốn môi trường, mỗi môi trường đóng góp 256 bước:

$$
N_{rollout}=4\times256=1.024\text{ transitions}
$$

Một rollout không đồng nghĩa một episode. Vì mỗi episode có 120 bước, 256 bước của một môi trường có thể đi qua nhiều episode và chứa cả đoạn episode chưa hoàn thành.

Trong giai đoạn thu rollout, trọng số mạng được giữ nguyên. Mỗi bước thực hiện:

1. Nhận observation và action mask của từng môi trường.
2. Actor tạo phân phối đã mask và lấy mẫu action; critic tính value.
3. Gửi action vào simulator, thực thi trong 120 giây mô phỏng.
4. Nhận reward, observation tiếp theo và trạng thái kết thúc.
5. Lưu dữ liệu và tiếp tục đến đủ số bước.

Rollout buffer giữ observation, action, reward, thông tin ranh giới episode, old value, old log probability và mask của từng mẫu. Old log probability dùng để tính PPO ratio; old value dùng để tính advantage và target; mask giúp tái tạo đúng tập lựa chọn của mẫu lúc thu thập.

Khi episode kết thúc, môi trường bắt đầu ca mới. Trainer dùng thông tin ranh giới để không nối reward và advantage giữa hai ca. Khi chỉ hết rollout mà episode vẫn tiếp tục, value tại observation cuối đoạn được dùng để bootstrap.

## 12. Cập nhật policy từ rollout

Sau khi thu đủ rollout, trainer tính GAE ngược theo thời gian và tạo return target cho critic. Các target được cố định trong vòng học trên lô dữ liệu đó.

1.024 mẫu được xáo trộn và chia thành minibatch 256 mẫu:

$$
\text{Minibatch mỗi epoch}=\frac{1.024}{256}=4
$$

Với bốn epoch:

$$
\text{Optimizer steps mỗi rollout}=4\times4=16
$$

Ở mỗi minibatch, policy hiện tại tính lại value, log probability và entropy, dùng đúng action mask đã lưu. Advantage được chuẩn hóa theo minibatch để tính policy loss; return target của critic đã được tính trước bước chuẩn hóa này.

Trainer tính ratio giữa log probability mới và cũ, tính PPO clipped loss, value loss và entropy bonus, rồi backpropagation, giới hạn norm gradient và cập nhật trọng số.

Trong bốn epoch, old log probability, old value và target vẫn là mốc tham chiếu của rollout. Đầu ra mạng mới thay đổi sau từng optimizer step. Không cần lưu một bản sao mạng cũ riêng để cung cấp các giá trị tham chiếu đã có trong buffer.

Sau vòng cập nhật, trainer thu rollout mới bằng policy vừa học. Đây là **on-policy learning** với việc tái sử dụng lô mới thu trong một số epoch; không phải replay buffer dài hạn lấy lại trải nghiệm từ nhiều thế hệ policy.

Với ngân sách 245.760 transitions và rollout 1.024 mẫu, mỗi run có 240 rollout đầy đủ. Agent không cập nhật mạng ngay sau từng quyết định hai phút; việc thu trải nghiệm và cập nhật được tổ chức thành các giai đoạn luân phiên.

## 13. Đánh giá trên validation

Training loss phản ánh mục tiêu tối ưu của mạng, nhưng không trực tiếp xác định chất lượng điều phối trên các ngày khác. Vì vậy, quá trình train được kết hợp với đánh giá riêng trên validation.

Trước khi học, repo đo validation tại step 0 để có mốc policy chưa được huấn luyện. Sau đó, callback đánh giá theo lịch mỗi 12.288 transitions train trên tập validation.

Trong lúc đánh giá, mạng không cập nhật trọng số. Controller sử dụng observation, action mask và `deterministic=True`, chọn action hợp lệ có xác suất cao nhất. Training lấy mẫu để khám phá; evaluation sử dụng cách chọn xác định để chấm policy.

Mỗi ngày validation được chạy đến hết episode rồi tổng hợp chi phí. Tiêu chí chọn mô hình là trung bình core cost trên các ngày:

$$
C_{val}=\frac{1}{N_{val}}\sum_{i=1}^{N_{val}}C_{core}^{(i)}
$$

Trong code, callback lấy trung bình cột `total_cost_core`. Cost thấp hơn là tốt hơn. Đây là mục tiêu tổng hợp theo trọng số, có đơn vị tương đương passenger-minute, không phải chi phí tiền tệ. Nó phản ánh chất lượng phục vụ và vận hành, không chỉ số lượng xe hoặc chi phí chạy xe.

Tập train dùng để cập nhật trọng số, validation dùng để chọn checkpoint, còn test dùng để báo cáo chất lượng sau khi chọn mô hình. standard-v1 có 200 ngày cho mỗi điều kiện test: nhu cầu bình thường, nhu cầu tăng đột biến và gián đoạn giao thông.

## 14. Chọn và lưu checkpoint

Checkpoint lưu trạng thái mô hình tại một thời điểm huấn luyện. Repo giữ phiên bản tốt nhất theo validation, thay vì mặc định chọn phiên bản cuối hoặc phiên bản có training loss thấp nhất.

Quy tắc chọn gồm:

1. Step 0 chỉ làm tham chiếu, không đủ điều kiện được chọn thành best.
2. Nếu mean validation core cost thấp hơn best hiện tại, lưu lại `best.zip`.
3. Nếu hai lần đánh giá có cost bằng nhau, giữ checkpoint sớm hơn.
4. Kết thúc train, lưu thêm `last.zip`, lịch sử đánh giá và metadata.

Các mốc được chọn trong standard-v1 cho thấy best không nhất thiết nằm ở cuối ngân sách:

| Cấu hình | Seed | Validation ban đầu | Validation tốt nhất | Mốc được chọn | Tổng transitions |
|---|---:|---:|---:|---:|---:|
| RL-MLP10 | 22 | 14.598,7 | 13.114,0 | 98.304 | 245.760 |
| RL-GRU10 | 11 | 18.075,8 | 13.189,8 | 172.032 | 245.760 |
| RL-Belief20-fade | 22 | 16.155,9 | 13.125,6 | 86.016 | 245.760 |

Đây là số validation từ báo cáo standard-v1, không phải ví dụ giả định. Chúng minh họa cách checkpoint được giữ trong từng run; ba hàng không đại diện cho toàn bộ so sánh hiệu năng giữa các encoder.

`best.zip` là phiên bản có validation cost thấp nhất trong những lần đánh giá đủ điều kiện. `last.zip` là phiên bản sau cập nhật cuối cùng. Metadata ghi lại seed, encoder, cửa sổ lịch sử, ngân sách, điểm validation và mốc chọn best để truy vết run.

Trong implementation hiện tại, callback validation chạy trong giai đoạn thu rollout, trước bước cập nhật của rollout đang thu. Mốc transitions biểu thị lượng trải nghiệm đã thu tại lần đánh giá. Khi ngân sách chia hết cho lịch validation, lần đo cuối có thể diễn ra trước cập nhật rollout cuối; vì vậy điểm validation cuối được ghi không mặc nhiên là điểm đánh giá lại trọng số `last.zip` sau cập nhật cuối.

## 15. Toàn bộ quy trình huấn luyện và sử dụng mô hình

```text
Config + kịch bản train/validation
                  ↓
Khởi tạo môi trường, encoder, actor, critic và rollout buffer
                  ↓
Đánh giá step 0 làm mốc tham chiếu
                  ↓
Thu rollout bằng policy hiện tại
  Observation + mask → sampled action → simulator → reward
  Lưu old value, old log probability và mask của từng mẫu
  Chạy validation và xét lưu best khi tới lịch đánh giá
                  ↓
Tính GAE và return target
                  ↓
Cập nhật 4 epoch, mỗi epoch 4 minibatch
  PPO loss + value loss − entropy bonus
                  ↓
Thu rollout mới bằng policy vừa cập nhật
                  ↓
Lặp đến đủ 245.760 training transitions
                  ↓
Lưu last, best đã chọn, lịch sử và metadata
                  ↓
Load best để evaluate trên các điều kiện test
```

Phần lõi rollout buffer, GAE và optimizer PPO được cung cấp bởi sb3-contrib/Stable-Baselines3. Repo tích hợp thuật toán với môi trường xe buýt, encoder, cấu hình, callback validation và evaluator.

Sau huấn luyện, controller không sử dụng một lịch điều phối cố định cho mọi ngày. Nó dùng trọng số đã học để biến observation và action mask mới thành một quyết định ở mỗi khoảng điều khiển. Khi evaluate hoặc suy luận, trọng số được giữ nguyên.

Actor–critic và advantage tạo tín hiệu cải thiện policy; PPO clipping kiểm soát động lực thay đổi khi tái sử dụng rollout; action masking áp dụng điều kiện thực thi; validation xác định phiên bản mô hình được giữ lại. Hiệu quả cuối cùng cần được đánh giá bằng cost, thời gian chờ, mức hoàn thành và bỏ cuộc trên các điều kiện test.

Trong standard-v1, ba encoder vẫn dùng cùng MaskablePPO. Báo cáo không cho thấy một encoder duy nhất có mean cost thấp nhất trong mọi điều kiện: MLP10 thấp nhất ở nhu cầu bình thường và gián đoạn giao thông, còn Belief20-fade thấp nhất khi nhu cầu tăng đột biến. Các chênh lệch giữa encoder được mô tả từ kết quả, chưa khẳng định ưu thế thống kê. Khi nhu cầu tăng đột biến, cost tổng thấp hơn baseline vẫn có thể đi cùng P95 thời gian chờ cao hơn; do đó tiêu chí chọn checkpoint và các chỉ số chất lượng phục vụ cần được phân biệt khi phân tích kết quả.
